import type { AdjustmentClause, PaymentClause } from './types'

export const delayClauseText =
  'En nuestra estimación, este trabajo se realiza en el plazo de un mes. De retrasarse por falta de materiales del cliente, el pago debería realizarse al mes de comenzado el trabajo. Si por algún retraso de producción el trabajo demorara más de un mes y medio, el segundo mes se cobra el 50%.'

export function renderAdjustmentClause(clause: AdjustmentClause) {
  if (clause.type === 'none') return ''
  if (clause.type === 'monthly-ipc') return 'Se realizarán ajustes por inflación ajustados al IPC mensual.'
  if (clause.type === 'custom') return clause.text

  const suffix = clause.untilSeasonEnd ? ' hasta el final de la temporada' : ''
  return `Se realizarán ajustes de manera bimestral${suffix} tomando de referencia el índice de inflación de precios al consumidor "Nivel General".`
}

export function renderPaymentClause(clause: PaymentClause) {
  if (clause.type === 'monthly-1-5') return 'El pago se realizará del 1 al 5 de cada mes, a mes vencido.'
  if (clause.type === 'on-delivery') return 'No se requiere seña. El pago se realizará una vez terminado el trabajo.'
  if (clause.type === 'custom') return clause.text

  const deposit = Number.isFinite(clause.percentage) ? clause.percentage : 30
  return `Se requiere una seña del ${deposit}% del total para comenzar el trabajo. El restante ${100 - deposit}% se abona contra entrega.`
}

export function renderValidity(value: { type: 'days' | 'date'; value: number | string }) {
  if (value.type === 'date') return `Este presupuesto tiene validez hasta el ${value.value}.`
  return `Este presupuesto tiene validez por ${value.value || 20} días.`
}
