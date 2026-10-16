import { NextRequest, NextResponse } from 'next/server'
import {
  markCashFlowClientBilled,
  markCashFlowClientCollected,
  type CashFlowBilledBy,
  type CashFlowCashbox,
} from '@/lib/cash-flow-sheets'
import { requireAdmin } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ row: string }> }
) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized

  try {
    const row = Number((await params).row)
    const body = await request.json()
    const cashbox = parseCashbox(body.cashbox)

    if (!Number.isInteger(row) || row < 3) {
      return NextResponse.json({ error: 'Fila inválida.' }, { status: 400 })
    }

    if (!cashbox) {
      return NextResponse.json({ error: 'Elegí a qué caja entró.' }, { status: 400 })
    }

    const result = await markCashFlowClientCollected({ row, cashbox })

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo marcar como cobrado.' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ row: string }> }
) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized

  try {
    const row = Number((await params).row)
    const body = await request.json()
    const billedBy = parseBilledBy(body.billedBy)

    if (!Number.isInteger(row) || row < 3) {
      return NextResponse.json({ error: 'Fila inválida.' }, { status: 400 })
    }

    if (!billedBy) {
      return NextResponse.json({ error: 'Elegí quién facturó.' }, { status: 400 })
    }

    const result = await markCashFlowClientBilled({ row, billedBy })

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo marcar como facturado.' },
      { status: 500 }
    )
  }
}

function parseCashbox(value: unknown): CashFlowCashbox | null {
  return value === 'Guido' || value === 'Mati' ? value : null
}

function parseBilledBy(value: unknown): CashFlowBilledBy | null {
  return value === 'Guido' || value === 'Mati' || value === 'Nadie' ? value : null
}
