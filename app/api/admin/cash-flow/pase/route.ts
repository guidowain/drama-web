import { NextResponse } from 'next/server'
import { createCashFlowBalanceTransfer, getCashFlowViewerData } from '@/lib/cash-flow-sheets'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const data = await getCashFlowViewerData()

    if (!data.balanceTransfer) {
      return NextResponse.json({ error: 'No hay deuda entre cajas para registrar.' }, { status: 400 })
    }

    const result = await createCashFlowBalanceTransfer(data.balanceTransfer)

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo crear el pase.' },
      { status: 500 }
    )
  }
}
