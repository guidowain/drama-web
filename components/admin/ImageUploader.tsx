'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { isVideoUrl } from '@/lib/media'

type Props = {
  value: string
  onChange: (url: string) => void
  /** Aspect ratio hint for the preview box, e.g. '16/9' or '1/1'. Default: '16/9' */
  aspect?: string
  placeholder?: string
  fit?: 'cover' | 'contain'
  accept?: 'image' | 'media'
}

declare global {
  interface Window {
    cloudinary?: {
      createUploadWidget: (
        options: {
          cloudName: string
          uploadPreset: string
          folder?: string
          sources?: string[]
          multiple?: boolean
          maxFiles?: number
          resourceType?: string
          clientAllowedFormats?: string[]
          maxFileSize?: number
        },
        callback: (
          error: unknown,
          result?: {
            event?: string
            info?: {
              secure_url?: string
              url?: string
              resource_type?: string
            }
          }
        ) => void
      ) => {
        open: () => void
      }
    }
  }
}

export default function ImageUploader({
  value,
  onChange,
  aspect = '16/9',
  placeholder,
  fit = 'cover',
  accept = 'image',
}: Props) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
  const acceptsVideo = accept === 'media'

  const openCloudinaryWidget = useCallback(async () => {
    setError('')

    if (!cloudName || !uploadPreset) {
      setError('Falta configurar Cloudinary')
      return
    }

    try {
      setUploading(true)

      if (!window.cloudinary) {
        await new Promise<void>((resolve, reject) => {
          const existingScript = document.querySelector<HTMLScriptElement>('script[data-cloudinary-upload-widget]')

          if (existingScript) {
            existingScript.addEventListener('load', () => resolve(), { once: true })
            existingScript.addEventListener('error', () => reject(new Error('No se pudo cargar Cloudinary')), { once: true })
            return
          }

          const script = document.createElement('script')
          script.src = 'https://upload-widget.cloudinary.com/global/all.js'
          script.async = true
          script.dataset.cloudinaryUploadWidget = 'true'
          script.onload = () => resolve()
          script.onerror = () => reject(new Error('No se pudo cargar Cloudinary'))
          document.body.appendChild(script)
        })
      }

      if (!window.cloudinary) {
        throw new Error('No se pudo iniciar Cloudinary')
      }

      const widget = window.cloudinary.createUploadWidget(
        {
          cloudName,
          uploadPreset,
          folder: 'drama-web/uploads',
          sources: ['local', 'url'],
          multiple: false,
          maxFiles: 1,
          resourceType: acceptsVideo ? 'auto' : 'image',
          clientAllowedFormats: acceptsVideo
            ? ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'mp4', 'webm', 'mov', 'm4v']
            : ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'],
          maxFileSize: acceptsVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024,
        },
        (error, result) => {
          if (error) {
            setError('Error al subir el archivo')
            setUploading(false)
            return
          }

          if (result?.event === 'success') {
            const url = result.info?.secure_url || result.info?.url

            if (!url) {
              setError('No se pudo obtener la URL del archivo')
              setUploading(false)
              return
            }

            onChange(url)
            setUploading(false)
          }

          if (result?.event === 'close') {
            setUploading(false)
          }
        }
      )

      widget.open()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al abrir Cloudinary')
      setUploading(false)
    }
  }, [acceptsVideo, cloudName, onChange, uploadPreset])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      openCloudinaryWidget()
    },
    [openCloudinaryWidget]
  )

  /* ─── con archivo ─── */
  if (value) {
    const isVideo = isVideoUrl(value)

    return (
      <div className="space-y-2">
        <div
          className="relative group rounded-xl overflow-hidden bg-zinc-900 border border-white/10"
          style={{ aspectRatio: aspect }}
        >
          {isVideo ? (
            <video
              src={value}
              className={fit === 'contain' ? 'h-full w-full object-contain' : 'h-full w-full object-cover'}
              autoPlay
              loop
              muted
              playsInline
              controls={false}
              preload="metadata"
            />
          ) : (
            <Image
              src={value}
              alt="Preview"
              fill
              className={fit === 'contain' ? 'object-contain' : 'object-cover'}
              unoptimized
            />
          )}
          {/* overlay hover */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={openCloudinaryWidget}
              disabled={uploading}
              className="px-4 py-2 bg-white text-black text-sm font-bold rounded-lg hover:bg-white/90 transition-colors"
            >
              {uploading ? 'Subiendo…' : 'Cambiar archivo'}
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              className="px-4 py-2 bg-red-500/80 text-white text-sm font-bold rounded-lg hover:bg-red-500 transition-colors"
            >
              Quitar
            </button>
          </div>
          {uploading && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
              <Spinner />
            </div>
          )}
        </div>
        {error && <p className="text-red-400 text-xs">{error}</p>}
      </div>
    )
  }

  /* ─── sin archivo — drop zone ─── */
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={openCloudinaryWidget}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        disabled={uploading}
        className={[
          'w-full rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-3 cursor-pointer',
          dragOver
            ? 'border-white/40 bg-white/5'
            : 'border-white/10 bg-zinc-900/50 hover:border-white/20 hover:bg-zinc-900',
        ].join(' ')}
        style={{ aspectRatio: aspect }}
      >
        {uploading ? (
          <>
            <Spinner />
            <span className="text-white/40 text-sm">Subiendo…</span>
          </>
        ) : (
          <>
            <UploadIcon />
            <div className="text-center">
              <p className="text-white/50 text-sm font-medium">
                {placeholder || (acceptsVideo ? 'Subí una imagen o video a Cloudinary' : 'Subí una imagen a Cloudinary')}
              </p>
              <p className="text-white/20 text-xs mt-0.5">
                {acceptsVideo ? 'JPG, PNG, WEBP, GIF, MP4, WEBM — máx 100MB' : 'JPG, PNG, WEBP, GIF — máx 10MB'}
              </p>
            </div>
          </>
        )}
      </button>
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  )
}

function UploadIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/20">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" strokeOpacity="0.2" />
      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
    </svg>
  )
}
