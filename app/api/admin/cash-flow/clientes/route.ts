import { NextRequest, NextResponse } from 'next/server'
import {
  createCashFlowClientMovement,
  getCashFlowClientsData,
  type CashFlowBilledBy,
  type CashFlowCashbox,
} from '@/lib/cash-flow-sheets'

export const dynamic = 'force-dynamic'

export async function GET() {
  const data = await getCashFlowClientsData()

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const mode = body.mode === 'collected' ? 'collected' : 'pending'
    const amount = Number(body.amount)
    const cashbox = parseCashbox(body.cashbox)
    const billedBy = parseBilledBy(body.billedBy)

    if (!body.date || typeof body.date !== 'string') {
      return NextResponse.json({ error: 'Falta la fecha.' }, { status: 400 })
    }

    if (!body.client || typeof body.client !== 'string') {
      return NextResponse.json({ error: 'Falta el cliente.' }, { status: 400 })
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'El monto tiene que ser mayor a cero.' }, { status: 400 })
    }

    if (mode === 'collected' && !cashbox) {
      return NextResponse.json({ error: 'Elegí a qué caja entró.' }, { status: 400 })
    }

    const result = await createCashFlowClientMovement({
      date: body.date,
      client: body.client,
      work: typeof body.work === 'string' ? body.work : '',
      amount,
      mode,
      cashbox: cashbox ?? undefined,
      billedBy,
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo crear el cobro.' },
      { status: 500 }
    )
  }
}

function parseCashbox(value: unknown): CashFlowCashbox | null {
  return value === 'Guido' || value === 'Mati' ? value : null
}

function parseBilledBy(value: unknown): CashFlowBilledBy | '' {
  return value === 'Guido' || value === 'Mati' || value === 'Nadie' ? value : ''
}
