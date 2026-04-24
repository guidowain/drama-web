'use client'

import { useRef, useState, useCallback } from 'react'
import Image from 'next/image'

type Props = {
  value: string
  onChange: (url: string) => void
  /** Aspect ratio hint for the preview box, e.g. '16/9' or '1/1'. Default: '16/9' */
  aspect?: string
  placeholder?: string
  fit?: 'cover' | 'contain'
}

export default function ImageUploader({
  value,
  onChange,
  aspect = '16/9',
  placeholder,
  fit = 'cover',
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')

  const upload = useCallback(
    async (file: File) => {
      setError('')
      setUploading(true)
      try {
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch('/api/upload', { method: 'POST', body: fd })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || 'Error al subir')
        }
        const { url } = await res.json()
        onChange(url)
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Error al subir imagen')
      } finally {
        setUploading(false)
      }
    },
    [onChange]
  )

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return
      upload(files[0])
    },
    [upload]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles]
  )

  /* ─── con imagen ─── */
  if (value) {
    return (
      <div className="space-y-2">
        <div
          className="relative group rounded-xl overflow-hidden bg-zinc-900 border border-white/10"
          style={{ aspectRatio: aspect }}
        >
          <Image
            src={value}
            alt="Preview"
            fill
            className={fit === 'contain' ? 'object-contain' : 'object-cover'}
            unoptimized
          />
          {/* overlay hover */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2 bg-white text-black text-sm font-bold rounded-lg hover:bg-white/90 transition-colors"
            >
              {uploading ? 'Subiendo…' : 'Cambiar imagen'}
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
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
    )
  }

  /* ─── sin imagen — drop zone ─── */
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
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
                {placeholder || 'Arrastrá una imagen o hacé click para subir'}
              </p>
              <p className="text-white/20 text-xs mt-0.5">JPG, PNG, WEBP, GIF — máx 10MB</p>
            </div>
          </>
        )}
      </button>
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
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
