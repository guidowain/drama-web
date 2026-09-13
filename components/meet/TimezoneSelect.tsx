'use client'

import { useMemo } from 'react'
import { timezoneLabel, timezoneOffset } from '@/lib/meet/slots'
import { listTimeZones } from '@/lib/meet/timezone'

type Props = {
  value: string
  onChange: (zone: string) => void
  /** Zonas que siempre tienen que estar en la lista, aunque el navegador no las liste. */
  ensure?: string[]
}

/**
 * Zona en la que se leen los horarios. Arranca en la del navegador —que es lo
 * que espera ver cualquiera— y se puede cambiar a mano.
 */
export default function TimezoneSelect({ value, onChange, ensure = [] }: Props) {
  const zones = useMemo(() => listTimeZones(value, ...ensure), [value, ensure])

  return (
    <label className="meet-tz">
      <span className="meet-tz-dot" aria-hidden="true" />
      <span className="meet-tz-text">
        Horarios en {timezoneLabel(value)} · {timezoneOffset(value)}
      </span>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="6 9 12 15 18 9" />
      </svg>
      <select
        className="meet-tz-select"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label="Zona horaria"
      >
        {zones.map((zone) => (
          <option key={zone} value={zone}>
            {zone.replace(/_/g, ' ')}
          </option>
        ))}
      </select>
    </label>
  )
}
