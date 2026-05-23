'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

export default function BalanceTransferButton() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function createTransfer() {
    setError('')
    startTransition(async () => {
      const response = await fetch('/api/admin/cash-flow/pase', {
        method: 'POST',
      })
      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        setError(result.error || 'No se pudo crear el pase.')
        return
      }

      router.refresh()
    })
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={createTransfer}
        disabled={isPending}
        className="rounded-md bg-white px-3 py-2 text-xs font-black uppercase tracking-wide text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? 'Creando...' : 'Pase'}
      </button>
      {error ? <p className="mt-2 text-xs font-semibold text-rose-300">{error}</p> : null}
    </div>
  )
}
