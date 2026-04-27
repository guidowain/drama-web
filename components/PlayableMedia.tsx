'use client'

import { useState } from 'react'
import type { CSSProperties } from 'react'
import { isVideoUrl } from '@/lib/media'

type Props = {
  src: string
  alt?: string
  className?: string
  videoClassName?: string
  imageClassName?: string
  style?: CSSProperties
  width?: string
  showMuteButton?: boolean
}

export default function PlayableMedia({
  src,
  alt = '',
  className = '',
  videoClassName,
  imageClassName,
  style,
  width,
  showMuteButton = true,
}: Props) {
  const [muted, setMuted] = useState(true)
  const mediaStyle = width ? { ...style, width, maxWidth: '140%' } : style
  const sharedClassName = className || 'w-full h-full object-cover'

  if (!isVideoUrl(src)) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={imageClassName || sharedClassName} style={mediaStyle} />
  }

  return (
    <div className="relative h-full w-full">
      <video
        src={src}
        className={videoClassName || `${sharedClassName} pointer-events-none`}
        style={mediaStyle}
        autoPlay
        loop
        muted={muted}
        playsInline
        preload="metadata"
        controls={false}
        disablePictureInPicture
        aria-label={alt || 'Video'}
      />
      {showMuteButton && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            setMuted((value) => !value)
          }}
          aria-label={muted ? 'Activar sonido' : 'Silenciar'}
          className="absolute bottom-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/65 text-white backdrop-blur transition-colors hover:bg-black/85"
        >
          {muted ? <MutedIcon /> : <SoundIcon />}
        </button>
      )}
    </div>
  )
}

function MutedIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="22" y1="9" x2="16" y2="15" />
      <line x1="16" y1="9" x2="22" y2="15" />
    </svg>
  )
}

function SoundIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M19 5a10 10 0 0 1 0 14" />
    </svg>
  )
}
