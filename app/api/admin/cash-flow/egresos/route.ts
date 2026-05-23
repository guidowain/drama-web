import { NextRequest, NextResponse } from 'next/server'
import {
  createCashFlowExpense,
  getCashFlowExpensesData,
  type CashFlowCashbox,
  type CashFlowExpenseCategory,
} from '@/lib/cash-flow-sheets'

export const dynamic = 'force-dynamic'

export async function GET() {
  const data = await getCashFlowExpensesData()

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const category = parseCategory(body.category)
    const cashbox = parseCashbox(body.cashbox)
    const amount = Number(body.amount)

    if (!body.date || typeof body.date !== 'string') {
      return NextResponse.json({ error: 'Falta la fecha.' }, { status: 400 })
    }

    if (!category) {
      return NextResponse.json({ error: 'Elegí una categoría válida.' }, { status: 400 })
    }

    if (!body.concept || typeof body.concept !== 'string') {
      return NextResponse.json({ error: 'Falta el concepto.' }, { status: 400 })
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'El monto tiene que ser mayor a cero.' }, { status: 400 })
    }

    if (!cashbox) {
      return NextResponse.json({ error: 'Elegí quién pagó.' }, { status: 400 })
    }

    const result = await createCashFlowExpense({
      date: body.date,
      category,
      concept: body.concept,
      detail: typeof body.detail === 'string' ? body.detail : '',
      amount,
      cashbox,
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo crear el egreso.' },
      { status: 500 }
    )
  }
}

function parseCategory(value: unknown): CashFlowExpenseCategory | null {
  return value === 'Sueldos' || value === 'Servicios' || value === 'Marketing' || value === 'Proveedores' ? value : null
}

function parseCashbox(value: unknown): CashFlowCashbox | null {
  return value === 'Guido' || value === 'Mati' ? value : null
}
