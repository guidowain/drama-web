'use client'

import { useState } from 'react'
import type { ContentBlock } from '@/lib/types'
import { generateId } from '@/lib/utils'
import ImageUploader from './ImageUploader'

type Props = {
  blocks: ContentBlock[]
  onChange: (blocks: ContentBlock[]) => void
}

export default function ContentBlockEditor({ blocks, onChange }: Props) {
  function addBlock(type: ContentBlock['type']) {
    const newBlock: ContentBlock = {
      id: generateId(),
      type,
      order: blocks.length,
      title: '',
      text: '',
      image: '',
      imageAlt: '',
      imageSide: 'left',
    }
    onChange([...blocks, newBlock])
  }

  function updateBlock(id: string, changes: Partial<ContentBlock>) {
    onChange(blocks.map((b) => (b.id === id ? { ...b, ...changes } : b)))
  }

  function removeBlock(id: string) {
    onChange(blocks.filter((b) => b.id !== id).map((b, i) => ({ ...b, order: i })))
  }

  function moveBlock(id: string, dir: -1 | 1) {
    const index = blocks.findIndex((b) => b.id === id)
    const newBlocks = [...blocks]
    const target = index + dir
    if (target < 0 || target >= newBlocks.length) return
    ;[newBlocks[index], newBlocks[target]] = [newBlocks[target], newBlocks[index]]
    onChange(newBlocks.map((b, i) => ({ ...b, order: i })))
  }

  const sorted = [...blocks].sort((a, b) => a.order - b.order)

  return (
    <div className="space-y-3">
      {sorted.map((block, i) => (
        <BlockCard
          key={block.id}
          block={block}
          index={i}
          total={sorted.length}
          onChange={(changes) => updateBlock(block.id, changes)}
          onRemove={() => removeBlock(block.id)}
          onMove={(dir) => moveBlock(block.id, dir)}
        />
      ))}

      {/* Add block buttons */}
      <div className="flex gap-2 flex-wrap pt-1">
        <AddBlockBtn icon={<TextIcon />} label="Texto" onClick={() => addBlock('text')} />
        <AddBlockBtn icon={<ImageIcon />} label="Imagen" onClick={() => addBlock('image')} />
        <AddBlockBtn icon={<ImageTextIcon />} label="Imagen + Texto" onClick={() => addBlock('imageText')} />
      </div>
    </div>
  )
}

/* ─────────────────────────── Block Card ─────────────────────────── */

function BlockCard({
  block,
  index,
  total,
  onChange,
  onRemove,
  onMove,
}: {
  block: ContentBlock
  index: number
  total: number
  onChange: (changes: Partial<ContentBlock>) => void
  onRemove: () => void
  onMove: (dir: -1 | 1) => void
}) {
  const [collapsed, setCollapsed] = useState(false)

  const typeLabel: Record<ContentBlock['type'], string> = {
    text: 'Texto',
    image: 'Imagen',
    imageText: 'Imagen + Texto',
  }

  return (
    <div className="rounded-2xl border border-white/8 bg-zinc-900 overflow-hidden">
      {/* ── Top bar ── */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5">
        {/* type pill */}
        <span className="flex items-center gap-1.5 text-white/30 text-xs uppercase tracking-widest">
          {block.type === 'text' && <TextIcon size={12} />}
          {block.type === 'image' && <ImageIcon size={12} />}
          {block.type === 'imageText' && <ImageTextIcon size={12} />}
          {typeLabel[block.type]}
        </span>
        <span className="text-white/10 text-xs ml-1">#{index + 1}</span>

        <div className="flex items-center gap-1 ml-auto">
          <MoveBtn onClick={() => onMove(-1)} disabled={index === 0} direction="up" />
          <MoveBtn onClick={() => onMove(1)} disabled={index === total - 1} direction="down" />
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="p-1.5 text-white/20 hover:text-white/60 transition-colors rounded-lg hover:bg-white/5"
            title={collapsed ? 'Expandir' : 'Colapsar'}
          >
            <CollapseIcon collapsed={collapsed} />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="p-1.5 text-white/20 hover:text-red-400 transition-colors rounded-lg hover:bg-red-400/10"
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      {!collapsed && (
        <div className="p-4">
          {block.type === 'text' && <TextBlock block={block} onChange={onChange} />}
          {block.type === 'image' && <ImageBlock block={block} onChange={onChange} />}
          {block.type === 'imageText' && <ImageTextBlock block={block} onChange={onChange} />}
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────── Block types ─────────────────────────── */

function TextBlock({ block, onChange }: { block: ContentBlock; onChange: (c: Partial<ContentBlock>) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-white/30 text-xs uppercase tracking-wider mb-1.5">
          Título <span className="normal-case text-white/15">(opcional)</span>
        </label>
        <input
          type="text"
          value={block.title || ''}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Encabezado del bloque…"
          className="w-full bg-zinc-800 border border-white/8 text-white text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-white/25 placeholder-white/15 transition-colors"
        />
      </div>
      <div>
        <label className="block text-white/30 text-xs uppercase tracking-wider mb-1.5">Texto</label>
        <textarea
          value={block.text || ''}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder="Escribí el contenido acá…"
          rows={5}
          className="w-full bg-zinc-800 border border-white/8 text-white text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-white/25 placeholder-white/15 resize-y transition-colors leading-relaxed"
        />
      </div>
    </div>
  )
}

function ImageBlock({ block, onChange }: { block: ContentBlock; onChange: (c: Partial<ContentBlock>) => void }) {
  return (
    <div className="space-y-3">
      <ImageUploader
        value={block.image || ''}
        onChange={(url) => onChange({ image: url })}
        aspect="16/9"
        placeholder="Arrastrá una imagen o hacé click para subir"
      />
      <div>
        <label className="block text-white/30 text-xs uppercase tracking-wider mb-1.5">
          Descripción <span className="normal-case text-white/15">(alt text)</span>
        </label>
        <input
          type="text"
          value={block.imageAlt || ''}
          onChange={(e) => onChange({ imageAlt: e.target.value })}
          placeholder="Ej: Afiche de la obra"
          className="w-full bg-zinc-800 border border-white/8 text-white text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-white/25 placeholder-white/15 transition-colors"
        />
      </div>
    </div>
  )
}

function ImageTextBlock({ block, onChange }: { block: ContentBlock; onChange: (c: Partial<ContentBlock>) => void }) {
  const side = block.imageSide || 'left'

  return (
    <div className="space-y-4">
      {/* Layout toggle */}
      <div className="flex items-center gap-2">
        <span className="text-white/30 text-xs uppercase tracking-wider">Layout</span>
        <div className="flex rounded-lg overflow-hidden border border-white/8">
          <button
            type="button"
            onClick={() => onChange({ imageSide: 'left' })}
            className={[
              'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors',
              side === 'left' ? 'bg-white text-black' : 'bg-zinc-800 text-white/40 hover:text-white/70',
            ].join(' ')}
          >
            <LayoutImgLeftIcon active={side === 'left'} />
            Foto izquierda
          </button>
          <button
            type="button"
            onClick={() => onChange({ imageSide: 'right' })}
            className={[
              'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors border-l border-white/8',
              side === 'right' ? 'bg-white text-black' : 'bg-zinc-800 text-white/40 hover:text-white/70',
            ].join(' ')}
          >
            <LayoutImgRightIcon active={side === 'right'} />
            Foto derecha
          </button>
        </div>
      </div>

      {/* Visual preview layout */}
      <div className={`grid grid-cols-2 gap-3 ${side === 'right' ? '' : ''}`}>
        {side === 'left' ? (
          <>
            <div>
              <label className="block text-white/30 text-xs uppercase tracking-wider mb-1.5">Imagen</label>
              <ImageUploader
                value={block.image || ''}
                onChange={(url) => onChange({ image: url })}
                aspect="4/3"
              />
              <input
                type="text"
                value={block.imageAlt || ''}
                onChange={(e) => onChange({ imageAlt: e.target.value })}
                placeholder="Alt de imagen…"
                className="mt-2 w-full bg-zinc-800 border border-white/8 text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-white/25 placeholder-white/15"
              />
            </div>
            <div>
              <label className="block text-white/30 text-xs uppercase tracking-wider mb-1.5">Texto</label>
              <input
                type="text"
                value={block.title || ''}
                onChange={(e) => onChange({ title: e.target.value })}
                placeholder="Título…"
                className="w-full bg-zinc-800 border border-white/8 text-white text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-white/25 placeholder-white/15 mb-2"
              />
              <textarea
                value={block.text || ''}
                onChange={(e) => onChange({ text: e.target.value })}
                placeholder="Escribí el texto que va al lado de la imagen…"
                rows={6}
                className="w-full bg-zinc-800 border border-white/8 text-white text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-white/25 placeholder-white/15 resize-none leading-relaxed"
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block text-white/30 text-xs uppercase tracking-wider mb-1.5">Texto</label>
              <input
                type="text"
                value={block.title || ''}
                onChange={(e) => onChange({ title: e.target.value })}
                placeholder="Título…"
                className="w-full bg-zinc-800 border border-white/8 text-white text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-white/25 placeholder-white/15 mb-2"
              />
              <textarea
                value={block.text || ''}
                onChange={(e) => onChange({ text: e.target.value })}
                placeholder="Escribí el texto que va al lado de la imagen…"
                rows={6}
                className="w-full bg-zinc-800 border border-white/8 text-white text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-white/25 placeholder-white/15 resize-none leading-relaxed"
              />
            </div>
            <div>
              <label className="block text-white/30 text-xs uppercase tracking-wider mb-1.5">Imagen</label>
              <ImageUploader
                value={block.image || ''}
                onChange={(url) => onChange({ image: url })}
                aspect="4/3"
              />
              <input
                type="text"
                value={block.imageAlt || ''}
                onChange={(e) => onChange({ imageAlt: e.target.value })}
                placeholder="Alt de imagen…"
                className="mt-2 w-full bg-zinc-800 border border-white/8 text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-white/25 placeholder-white/15"
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/* ─────────────────────────── Small components ─────────────────────────── */

function AddBlockBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-white/8 hover:border-white/15 text-white/50 hover:text-white text-sm rounded-xl transition-all"
    >
      <span className="text-white/30">{icon}</span>
      + {label}
    </button>
  )
}

function MoveBtn({ onClick, disabled, direction }: { onClick: () => void; disabled: boolean; direction: 'up' | 'down' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="p-1.5 text-white/20 hover:text-white/60 disabled:opacity-20 disabled:cursor-not-allowed transition-colors rounded-lg hover:bg-white/5"
    >
      {direction === 'up' ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
      )}
    </button>
  )
}

function CollapseIcon({ collapsed }: { collapsed: boolean }) {
  return collapsed ? (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
  ) : (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
  )
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
    </svg>
  )
}

function TextIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/>
    </svg>
  )
}

function ImageIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
    </svg>
  )
}

function ImageTextIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="8" height="8" rx="1"/><line x1="14" y1="6" x2="21" y2="6"/><line x1="14" y1="10" x2="21" y2="10"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="3" y1="19" x2="21" y2="19"/>
    </svg>
  )
}

function LayoutImgLeftIcon({ active }: { active: boolean }) {
  const c = active ? '#000' : 'currentColor'
  return (
    <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
      <rect x="0.5" y="0.5" width="8" height="13" rx="1" fill={active ? '#000' : 'none'} stroke={c} strokeOpacity="0.4"/>
      <line x1="10.5" y1="3.5" x2="19.5" y2="3.5" stroke={c} strokeOpacity="0.4" strokeLinecap="round"/>
      <line x1="10.5" y1="7" x2="19.5" y2="7" stroke={c} strokeOpacity="0.4" strokeLinecap="round"/>
      <line x1="10.5" y1="10.5" x2="16" y2="10.5" stroke={c} strokeOpacity="0.4" strokeLinecap="round"/>
    </svg>
  )
}

function LayoutImgRightIcon({ active }: { active: boolean }) {
  const c = active ? '#000' : 'currentColor'
  return (
    <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
      <line x1="0.5" y1="3.5" x2="9.5" y2="3.5" stroke={c} strokeOpacity="0.4" strokeLinecap="round"/>
      <line x1="0.5" y1="7" x2="9.5" y2="7" stroke={c} strokeOpacity="0.4" strokeLinecap="round"/>
      <line x1="0.5" y1="10.5" x2="6" y2="10.5" stroke={c} strokeOpacity="0.4" strokeLinecap="round"/>
      <rect x="11.5" y="0.5" width="8" height="13" rx="1" fill={active ? '#000' : 'none'} stroke={c} strokeOpacity="0.4"/>
    </svg>
  )
}
