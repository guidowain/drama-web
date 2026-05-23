import { NextRequest, NextResponse } from 'next/server'
import { markCashFlowClientCollected, type CashFlowCashbox } from '@/lib/cash-flow-sheets'

export const dynamic = 'force-dynamic'

export async function PUT(
  request: NextRequest,
  { params }: { params: { row: string } }
) {
  try {
    const row = Number(params.row)
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

function parseCashbox(value: unknown): CashFlowCashbox | null {
  return value === 'Guido' || value === 'Mati' ? value : null
}
