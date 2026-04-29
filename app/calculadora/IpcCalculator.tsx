'use client'

import { useState } from 'react'

const IPC_MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

type IpcRow = [string, number]

function ipcMesLabel(fecha: string) {
  const [y, m] = fecha.split('-')
  return IPC_MESES[parseInt(m, 10) - 1] + ' ' + y
}

function ipcFmtPeso(n: number) {
  return '$ ' + Math.round(n).toLocaleString('es-AR')
}

export default function IpcCalculator() {
  const [monto, setMonto] = useState('')
  const [estado, setEstado] = useState('')
  const [estadoTipo, setEstadoTipo] = useState('')
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState<{
    nuevo: number
    acum: number
    meses: [IpcRow, IpcRow]
  } | null>(null)

  async function ipcCalcular() {
    const montoNumero = parseFloat(monto)

    if (!montoNumero || montoNumero <= 0) {
      setEstado('Ingresá un monto válido.')
      setEstadoTipo('error')
      return
    }

    setLoading(true)
    setResultado(null)
    setEstado('Consultando INDEC...')
    setEstadoTipo('loading')

    try {
      const res = await fetch('https://ipc-proxy.vercel.app/api/ipc')
      if (!res.ok) throw new Error('Proxy error')

      const inner = await res.json()
      const data = inner.data as IpcRow[]

      const m2 = data[0]
      const m1 = data[1]

      const acum = (1 + m1[1]) * (1 + m2[1]) - 1
      const nuevo = montoNumero * (1 + acum)

      setResultado({ nuevo, acum, meses: [m1, m2] })
      setEstado('')
      setEstadoTipo('')
    } catch {
      setEstado('No se pudo obtener el IPC.')
      setEstadoTipo('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ipc-wrap">
      <style>{`
        .ipc-wrap {
          font-family: 'Segoe UI', system-ui, sans-serif;
          background: #0f0f13;
          color: #e8e8f0;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          width: 100%;
        }

        .ipc-card {
          background: #1a1a24;
          border: 1px solid #2a2a3a;
          border-radius: 16px;
          padding: 32px;
          width: 100%;
          max-width: 460px;
        }

        .ipc-card h1 {
          font-size: 1.1rem;
          font-weight: 600;
          color: #fff;
          letter-spacing: -0.02em;
          margin-bottom: 28px;
        }

        .ipc-card label {
          display: block;
          font-size: 0.75rem;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 8px;
        }

        .ipc-input-wrap {
          position: relative;
          margin-bottom: 20px;
        }

        .ipc-currency {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 1rem;
          color: #555;
          font-weight: 500;
        }

        .ipc-card input[type="number"] {
          width: 100%;
          background: #0f0f13;
          border: 1px solid #2a2a3a;
          border-radius: 10px;
          padding: 14px 14px 14px 32px;
          font-size: 1.5rem;
          font-weight: 600;
          color: #fff;
          outline: none;
          -moz-appearance: textfield;
        }

        .ipc-card input[type="number"]::-webkit-inner-spin-button,
        .ipc-card input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
        }

        .ipc-card input[type="number"]:focus {
          border-color: #5b5bd6;
        }

        .ipc-btn {
          width: 100%;
          background: #5b5bd6;
          color: #fff;
          border: none;
          border-radius: 10px;
          padding: 14px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s;
        }

        .ipc-btn:hover {
          background: #6e6ee0;
        }

        .ipc-btn:active {
          transform: scale(0.98);
        }

        .ipc-btn:disabled {
          background: #2a2a3a;
          color: #555;
          cursor: not-allowed;
        }

        .ipc-estado {
          font-size: 0.75rem;
          margin-top: 10px;
          text-align: center;
          min-height: 18px;
          color: #555;
        }

        .ipc-estado.loading {
          color: #8888ff;
        }

        .ipc-estado.error {
          color: #f87171;
        }

        .ipc-result {
          margin-top: 24px;
          background: #0f0f13;
          border: 1px solid #2a2a3a;
          border-radius: 12px;
          padding: 20px;
          display: none;
        }

        .ipc-result.show {
          display: block;
        }

        .ipc-result-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 16px;
          padding-bottom: 16px;
          border-bottom: 1px solid #1e1e2e;
          gap: 16px;
        }

        .ipc-result-label {
          font-size: 0.75rem;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .ipc-result-value {
          font-size: 2rem;
          font-weight: 700;
          color: #fff;
          margin-top: 4px;
        }

        .ipc-result-value small {
          font-size: 0.85rem;
          color: #888;
          font-weight: 400;
        }

        .ipc-badge {
          background: #1a2e1a;
          border: 1px solid #2a4a2a;
          color: #4ade80;
          font-size: 1.1rem;
          font-weight: 700;
          padding: 8px 14px;
          border-radius: 8px;
          white-space: nowrap;
        }

        .ipc-chips {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .ipc-chip {
          background: #1a1a2e;
          border: 1px solid #2a2a4a;
          border-radius: 6px;
          padding: 5px 10px;
          font-size: 0.75rem;
          color: #aaa;
        }

        .ipc-chip b {
          color: #8888ff;
        }

        .ipc-fuente {
          font-size: 0.72rem;
          color: #444;
          margin-top: 12px;
        }
      `}</style>

      <div className="ipc-card">
        <h1>Calculadora IPC</h1>

        <label htmlFor="ipc-monto">Presupuesto del mes actual</label>
        <div className="ipc-input-wrap">
          <span className="ipc-currency">$</span>
          <input
            type="number"
            id="ipc-monto"
            placeholder="0"
            min="0"
            value={monto}
            onChange={(event) => setMonto(event.target.value)}
          />
        </div>

        <button className="ipc-btn" onClick={ipcCalcular} disabled={loading}>
          Calcular ajuste
        </button>
        <div className={`ipc-estado${estadoTipo ? ' ' + estadoTipo : ''}`}>
          {estado}
        </div>

        <div className={`ipc-result${resultado ? ' show' : ''}`}>
          {resultado ? (
            <>
              <div className="ipc-result-top">
                <div>
                  <div className="ipc-result-label">Nuevo presupuesto</div>
                  <div className="ipc-result-value">
                    {ipcFmtPeso(resultado.nuevo)} <small>ARS</small>
                  </div>
                </div>
                <div className="ipc-badge">
                  +{(resultado.acum * 100).toFixed(1)}%
                </div>
              </div>

              <div className="ipc-chips">
                <div className="ipc-chip">
                  {ipcMesLabel(resultado.meses[0][0])}:{' '}
                  <b>+{(resultado.meses[0][1] * 100).toFixed(1)}%</b>
                </div>
                <div className="ipc-chip">
                  {ipcMesLabel(resultado.meses[1][0])}:{' '}
                  <b>+{(resultado.meses[1][1] * 100).toFixed(1)}%</b>
                </div>
              </div>
              <div className="ipc-fuente">Fuente: INDEC</div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
