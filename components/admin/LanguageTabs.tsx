import type { LocaleCode } from '@/lib/types'

const LANGUAGES: Array<{ code: LocaleCode; label: string }> = [
  { code: 'es', label: 'ES' },
  { code: 'en', label: 'EN' },
  { code: 'pt', label: 'PT' },
]

export default function LanguageTabs({
  value,
  onChange,
}: {
  value: LocaleCode
  onChange: (value: LocaleCode) => void
}) {
  return (
    <div className="inline-flex overflow-hidden rounded-full border border-white/10 bg-zinc-900 p-1">
      {LANGUAGES.map((language) => (
        <button
          key={language.code}
          type="button"
          onClick={() => onChange(language.code)}
          className={[
            'min-w-10 rounded-full px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] transition-colors',
            value === language.code
              ? 'bg-white text-black'
              : 'text-white/35 hover:bg-white/5 hover:text-white/70',
          ].join(' ')}
        >
          {language.label}
        </button>
      ))}
    </div>
  )
}
