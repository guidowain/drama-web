'use client'

import { createElement, useEffect, useMemo, useState } from 'react'
import { servicesCatalog } from '@/data/services-catalog'
import { budgetBrand } from '@/lib/presupuestador/brand'
import { delayClauseText, renderAdjustmentClause, renderPaymentClause, renderValidity } from '@/lib/presupuestador/clauses'
import { budgetStorage, makeId, sanitizePdfFilename } from '@/lib/presupuestador/storage'
import type { BudgetDraft, BudgetModality, FixedInvestment, MonthlyInvestment, ServiceItem } from '@/lib/presupuestador/types'

const steps = ['Modalidad', 'Datos', 'Textos', 'Servicios', 'Inversión', 'Condiciones', 'Preview']
const identityMergeIds = ['identidad-0', 'identidad-1', 'identidad-2']
const identityMergeLabelOrder = ['identidad-0', 'identidad-2', 'identidad-1']
const identityMergeLabels: Record<string, string> = {
  'identidad-0': 'Creación',
  'identidad-1': 'Gestión',
  'identidad-2': 'Rediseño',
}

export default function BudgetBuilder() {
  const [drafts, setDrafts] = useState<BudgetDraft[]>([])
  const [generated, setGenerated] = useState<BudgetDraft[]>([])
  const [draft, setDraft] = useState<BudgetDraft>(() => createDraft('monthly'))
  const [step, setStep] = useState(0)
  const [customService, setCustomService] = useState('')
  const [notIncludedInput, setNotIncludedInput] = useState('')

  useEffect(() => {
    refreshLists()
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (draft.status === 'draft' && (draft.projectName || draft.client.name || draft.services.length)) {
        budgetStorage.saveDraft({ ...draft, updatedAt: new Date().toISOString() })
        refreshLists()
      }
    }, 900)

    return () => window.clearTimeout(timer)
  }, [draft])

  const total = useMemo(() => getTotal(draft), [draft])
  const filename = `${compactDate(draft.date)} Presupuesto - ${sanitizePdfFilename(draft.projectName || 'DRAMA')}.pdf`

  function refreshLists() {
    setDrafts(budgetStorage.drafts())
    setGenerated(budgetStorage.generated())
  }

  function update(changes: Partial<BudgetDraft>) {
    setDraft((current) => ({ ...current, ...changes, updatedAt: new Date().toISOString() }))
  }

  function switchModality(modality: BudgetModality) {
    update({
      modality,
      investment: defaultInvestment(modality),
      conditions: defaultConditions(modality),
    })
  }

  function toggleCatalogService(service: { id: string; label: string }) {
    const exists = hasSelectedService(draft.services, service.id)
    update({
      services: normalizeMergedServices(exists
        ? removeServiceById(draft.services, service.id)
        : [...draft.services, { ...service, source: 'catalog' }]),
    })
  }

  function addCustomService() {
    const label = customService.trim()
    if (!label) return
    update({ services: [...draft.services, { id: makeId('service'), label, source: 'custom' }] })
    setCustomService('')
  }

  function addNotIncluded() {
    const value = notIncludedInput.trim()
    if (!value) return
    update({ notIncluded: [...(draft.notIncluded || []), value] })
    setNotIncludedInput('')
  }

  function moveService(index: number, direction: -1 | 1) {
    const next = [...draft.services]
    const target = index + direction
    if (target < 0 || target >= next.length) return
    const [item] = next.splice(index, 1)
    next.splice(target, 0, item)
    update({ services: next })
  }

  function markGenerated() {
    const next = { ...draft, status: 'generated' as const, updatedAt: new Date().toISOString() }
    budgetStorage.saveGenerated(next)
    budgetStorage.removeDraft(next.id)
    setDraft(next)
    refreshLists()
  }

  function duplicate(source: BudgetDraft) {
    const now = new Date().toISOString()
    const normalizedSource = normalizeLegacyDraft(source)
    setDraft({
      ...normalizedSource,
      id: makeId(),
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    })
    setStep(1)
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="border-b border-white/5 px-8 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.32em] text-white/30">Herramienta interna</p>
            <h1 className="font-black uppercase tracking-tight text-3xl text-white">Presupuestador</h1>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-1">
            {(['ARS', 'USD'] as const).map((currency) => (
              <button
                key={currency}
                onClick={() => update({ currency })}
                className={`rounded-lg px-4 py-2 text-xs font-black uppercase tracking-widest transition ${draft.currency === currency ? 'gradient-bg text-black' : 'text-white/45 hover:text-white'}`}
              >
                {currency}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 p-6 xl:grid-cols-[260px_minmax(0,1fr)_360px]">
        <aside className="space-y-4">
          <button
            onClick={() => {
              setDraft(createDraft('monthly'))
              setStep(0)
            }}
            className="w-full rounded-xl gradient-bg px-4 py-3 text-left font-black uppercase tracking-widest text-black"
          >
            Nuevo presupuesto
          </button>

          <StoredList title="Borradores" items={drafts} onOpen={(item) => { setDraft(normalizeLegacyDraft(item)); setStep(1) }} onDelete={(id) => { budgetStorage.removeDraft(id); refreshLists() }} onDuplicate={duplicate} />
          <StoredList title="Generados" items={generated} onOpen={(item) => { setDraft(normalizeLegacyDraft(item)); setStep(6) }} onDelete={(id) => { budgetStorage.removeGenerated(id); refreshLists() }} onDuplicate={duplicate} />
        </aside>

        <main className="rounded-2xl border border-white/10 bg-zinc-900/70 p-5">
          <div className="mb-6 flex flex-wrap gap-2">
            {steps.map((label, index) => (
              <button
                key={label}
                onClick={() => setStep(index)}
                className={`rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider ${step === index ? 'bg-white text-black' : 'bg-white/5 text-white/35 hover:text-white'}`}
              >
                {index + 1}. {label}
              </button>
            ))}
          </div>

          {step === 0 ? <StepModality value={draft.modality} onChange={switchModality} /> : null}
          {step === 1 ? <StepBasics draft={draft} update={update} /> : null}
          {step === 2 ? <StepTexts draft={draft} update={update} /> : null}
          {step === 3 ? (
            <StepServices
              draft={draft}
              customService={customService}
              notIncludedInput={notIncludedInput}
              setCustomService={setCustomService}
              setNotIncludedInput={setNotIncludedInput}
              toggleCatalogService={toggleCatalogService}
              addCustomService={addCustomService}
              addNotIncluded={addNotIncluded}
              update={update}
              moveService={moveService}
            />
          ) : null}
          {step === 4 ? <StepInvestment draft={draft} update={update} /> : null}
          {step === 5 ? <StepConditions draft={draft} update={update} /> : null}
          {step === 6 ? <Preview draft={draft} total={total} /> : null}

          <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-5">
            <button
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-white/60 disabled:opacity-30"
            >
              Atrás
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => budgetStorage.saveDraft(draft)}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-white/60 hover:text-white"
              >
                Guardar borrador
              </button>
              {step < steps.length - 1 ? (
                <button onClick={() => setStep(step + 1)} className="rounded-xl bg-white px-5 py-2 text-sm font-black text-black">
                  Siguiente
                </button>
              ) : (
                <button
                  onClick={async () => {
                    await downloadBudgetPdf(draft, filename)
                    markGenerated()
                  }}
                  className="rounded-xl gradient-bg px-5 py-2 text-sm font-black text-black"
                >
                  Descargar PDF
                </button>
              )}
            </div>
          </div>
        </main>

        <aside className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.26em] text-white/30">Vista rápida</p>
          <h2 className="mt-2 text-2xl font-black uppercase leading-none text-white">{draft.projectName || 'Sin proyecto'}</h2>
          <p className="mt-2 text-sm text-white/35">{draft.client.name || 'Sin solicitante'}</p>
          <div className="mt-6 rounded-xl bg-black p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/35">Total</p>
            <p className="mt-1 text-3xl font-black text-white">{money(total, draft.currency)}</p>
          </div>
          <div className="mt-5 space-y-2 text-sm text-white/45">
            <p>{modalityLabel(draft.modality)}</p>
            <p>{draft.services.length} servicios seleccionados</p>
            <p>Autoguardado local</p>
          </div>
        </aside>
      </div>
    </div>
  )
}

function StepModality({ value, onChange }: { value: BudgetModality; onChange: (value: BudgetModality) => void }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {([
        ['monthly', 'Abono mensual', 'Retainer mensual para obra o show.'],
        ['fixed', 'Proyecto cerrado', 'Trabajo puntual con una o varias opciones.'],
      ] as const).map(([id, title, desc]) => (
        <button key={id} onClick={() => onChange(id)} className={`rounded-2xl border p-5 text-left transition ${value === id ? 'border-white bg-white text-black' : 'border-white/10 bg-white/5 text-white hover:border-white/25'}`}>
          <h2 className="font-black uppercase">{title}</h2>
          <p className={`mt-2 text-sm ${value === id ? 'text-black/60' : 'text-white/40'}`}>{desc}</p>
        </button>
      ))}
    </div>
  )
}

function StepBasics({ draft, update }: StepProps) {
  return (
    <FieldGrid>
      <Input label="Fecha" type="date" value={draft.date} onChange={(date) => update({ date })} />
      <Input label="Solicitante" value={draft.client.name} onChange={(name) => update({ client: { ...draft.client, name } })} />
      <Input label="Empresa / productora" value={draft.client.company || ''} onChange={(company) => update({ client: { ...draft.client, company } })} />
      <Input label="Proyecto" value={draft.projectName} onChange={(projectName) => update({ projectName })} wide />
    </FieldGrid>
  )
}

function StepTexts({ draft, update }: StepProps) {
  return (
    <div className="space-y-4">
      <Textarea label="Bloque de apertura" value={draft.opening || ''} onChange={(opening) => update({ opening })} rows={3} />
      <Textarea label="Entendimiento del proyecto" value={draft.understanding || ''} onChange={(understanding) => update({ understanding })} rows={8} />
      {draft.modality === 'fixed' ? <Textarea label="Plazo de entrega" value={draft.deliveryNote || ''} onChange={(deliveryNote) => update({ deliveryNote })} rows={4} /> : null}
      <Textarea label="Extras / aclaraciones" value={draft.extras || ''} onChange={(extras) => update({ extras })} rows={4} />
    </div>
  )
}

function StepServices(props: {
  draft: BudgetDraft
  customService: string
  notIncludedInput: string
  setCustomService: (value: string) => void
  setNotIncludedInput: (value: string) => void
  toggleCatalogService: (service: { id: string; label: string }) => void
  addCustomService: () => void
  addNotIncluded: () => void
  update: (changes: Partial<BudgetDraft>) => void
  moveService: (index: number, direction: -1 | 1) => void
}) {
  const { draft, update } = props
  const [openCategory, setOpenCategory] = useState(servicesCatalog[0]?.id || '')

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4">
        {servicesCatalog.map((category) => (
          <section key={category.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
            <button
              type="button"
              onClick={() => setOpenCategory(openCategory === category.id ? '' : category.id)}
              className="flex w-full items-center justify-between gap-3 text-left font-black uppercase text-white"
              aria-expanded={openCategory === category.id}
            >
              <span>{category.name}</span>
              <span className="text-white/35">{openCategory === category.id ? '-' : '+'}</span>
            </button>
            {openCategory === category.id ? (
              <div className="mt-3 grid gap-2">
                {category.services.map((service) => {
                const checked = hasSelectedService(draft.services, service.id)
                  return (
                    <label key={service.id} className="flex items-start gap-3 rounded-lg bg-white/5 p-3 text-sm text-white/65">
                      <input type="checkbox" checked={checked} onChange={() => props.toggleCatalogService(service)} className="mt-1" />
                      <span>{service.label}</span>
                    </label>
                  )
                })}
              </div>
            ) : null}
          </section>
        ))}
        <div className="flex gap-2">
          <input value={props.customService} onChange={(event) => props.setCustomService(event.target.value)} placeholder="Servicio custom" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black px-3 py-2 text-white outline-none" />
          <button onClick={props.addCustomService} className="rounded-xl bg-white px-4 py-2 font-black text-black">Agregar</button>
        </div>
      </div>

      <div className="space-y-4">
        <PanelTitle>Orden en PDF</PanelTitle>
        {draft.services.map((service, index) => (
          <div key={service.id} className="relative rounded-xl border border-white/10 bg-white/5 p-3 pr-10">
            <button
              type="button"
              onClick={() => update({ services: removeServiceById(draft.services, service.id) })}
              className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
              aria-label={`Borrar ${service.label}`}
              title="Borrar"
            >
              ×
            </button>
            <p className="text-sm font-bold text-white">{service.label}</p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => props.moveService(index, -1)}
                disabled={index === 0}
                className="icon-mini"
                aria-label={`Subir ${service.label}`}
                title="Subir"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => props.moveService(index, 1)}
                disabled={index === draft.services.length - 1}
                className="icon-mini"
                aria-label={`Bajar ${service.label}`}
                title="Bajar"
              >
                ↓
              </button>
            </div>
          </div>
        ))}
        <PanelTitle>No incluye</PanelTitle>
        <div className="flex gap-2">
          <input value={props.notIncludedInput} onChange={(event) => props.setNotIncludedInput(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black px-3 py-2 text-white outline-none" />
          <button onClick={props.addNotIncluded} className="rounded-xl bg-white px-3 py-2 text-sm font-black text-black">+</button>
        </div>
        {(draft.notIncluded || []).map((item, index) => (
          <button key={`${item}-${index}`} onClick={() => update({ notIncluded: draft.notIncluded?.filter((_, i) => i !== index) })} className="block text-left text-sm text-white/45 hover:text-white">
            - {item}
          </button>
        ))}
      </div>
    </div>
  )
}

function StepInvestment({ draft, update }: StepProps) {
  if (draft.investment.type === 'monthly-total') {
    const investment = draft.investment
    return <Input label="Total mensual" type="number" value={String(investment.total || '')} onChange={(value) => update({ investment: { ...investment, total: Number(value) } })} />
  }

  if (draft.investment.type === 'fixed-options') {
    const investment = draft.investment as FixedInvestment
    return <RowsEditor title="Opciones de inversión" rows={investment.options} columns={['label', 'amount']} labels={['Etiqueta', 'Monto']} onChange={(options) => update({ investment: { ...investment, options } })} />
  }

  return null
}

function StepConditions({ draft, update }: StepProps) {
  const conditions = draft.conditions

  return (
    <FieldGrid>
      <Select label="Cláusula de ajuste" value={conditions.adjustment.type === 'monthly-ipc' ? 'bimonthly-ipc' : conditions.adjustment.type} onChange={(type) => update({ conditions: { ...conditions, adjustment: type === 'bimonthly-ipc' ? { type, untilSeasonEnd: true } : type === 'custom' ? { type, text: '' } : { type } as any } })} options={[['bimonthly-ipc', 'Bimestral IPC'], ['none', 'Sin ajuste'], ['custom', 'Custom']]} />
      <Select label="Pago" value={conditions.payment.type} onChange={(type) => update({ conditions: { ...conditions, payment: type === 'deposit' ? { type, percentage: 30 } : type === 'custom' ? { type, text: '' } : { type } as any } })} options={[['monthly-1-5', 'Mes vencido 1 al 5'], ['deposit', 'Seña + saldo'], ['on-delivery', 'Contra entrega'], ['custom', 'Custom']]} />
      {conditions.payment.type === 'deposit' ? <Input label="% seña" type="number" value={String(conditions.payment.percentage)} onChange={(percentage) => update({ conditions: { ...conditions, payment: { type: 'deposit', percentage: Number(percentage) } } })} /> : null}
      {conditions.payment.type === 'custom' ? <Input label="Texto pago custom" value={conditions.payment.text} onChange={(text) => update({ conditions: { ...conditions, payment: { type: 'custom', text } } })} wide /> : null}
      {conditions.adjustment.type === 'custom' ? <Input label="Texto ajuste custom" value={conditions.adjustment.text} onChange={(text) => update({ conditions: { ...conditions, adjustment: { type: 'custom', text } } })} wide /> : null}
      <Select label="Validez" value={conditions.validity.type} onChange={(type) => update({ conditions: { ...conditions, validity: { type: type as 'days' | 'date', value: type === 'days' ? 20 : draft.date } } })} options={[['days', 'Días'], ['date', 'Fecha exacta']]} />
      <Input label={conditions.validity.type === 'days' ? 'Días de validez' : 'Fecha de validez'} type={conditions.validity.type === 'days' ? 'number' : 'date'} value={String(conditions.validity.value)} onChange={(value) => update({ conditions: { ...conditions, validity: { ...conditions.validity, value: conditions.validity.type === 'days' ? Number(value) : value } } })} />
      <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-4 text-sm font-bold text-white/70">
        <input type="checkbox" checked={conditions.delayClause} onChange={(event) => update({ conditions: { ...conditions, delayClause: event.target.checked } })} />
        Incluir cláusula de demora
      </label>
    </FieldGrid>
  )
}

function Preview({ draft, total }: { draft: BudgetDraft; total: number }) {
  const adjustment = renderAdjustmentClause(draft.conditions.adjustment)
  return (
    <div className="mx-auto max-w-3xl rounded-[28px] border border-[#e5ded4] bg-[#fffdf8] p-5 font-sans text-[#111] shadow-2xl">
      <div className="gradient-bg flex h-[130px] items-center justify-center overflow-hidden rounded-2xl">
        <img src={budgetBrand.logoPath} alt="DRAMA" className="h-auto w-40" />
      </div>
      <div className="px-6 pb-8 pt-7 md:px-8">
        <div className="mt-8 flex items-start justify-between gap-6">
          <p className="font-enriq text-xs font-black uppercase tracking-[0.22em] text-[#6f6b67]">{draft.client.name || 'Solicitante'}{draft.client.company ? ` / ${draft.client.company}` : ''}</p>
          <p className="text-right text-xs leading-relaxed text-[#6f6b67]">{formatPreviewDate(draft.date)}</p>
        </div>
        <h2 className="mt-2 font-enriq text-5xl font-black uppercase leading-[0.9] md:text-6xl">{draft.projectName || 'Nombre del proyecto'}</h2>
        {draft.opening ? <p className="mt-6 text-lg leading-relaxed">{draft.opening}</p> : null}
        {draft.understanding ? <PreviewSection title="Entendimiento del proyecto">{draft.understanding}</PreviewSection> : null}
        <PreviewSection title="Servicios"><PreviewServices services={draft.services} /></PreviewSection>
        {draft.notIncluded?.length ? <PreviewSection title="No incluye">{draft.notIncluded.map((item, index) => <PreviewBullet key={index}>{item}</PreviewBullet>)}</PreviewSection> : null}
        <div className="mt-7 overflow-hidden rounded-2xl bg-[#111] text-[#fffdf8]">
          <div className="gradient-bg h-1.5" />
          <div className="flex flex-wrap items-center justify-between gap-3 p-5">
            <p className="font-enriq text-xs font-black uppercase tracking-widest">{draft.modality === 'monthly' ? 'Inversión mensual' : 'Inversión'}</p>
            <p className="font-enriq text-4xl font-black leading-none">{money(total, draft.currency)}</p>
          </div>
        </div>
        {draft.modality === 'fixed' && draft.deliveryNote ? <PreviewSection title="Plazo de entrega">{draft.deliveryNote}</PreviewSection> : null}
      <div className="ml-3 mt-7 space-y-2 text-sm leading-relaxed">
          <p>{renderValidity(draft.conditions.validity)}</p>
          <p>{renderPaymentClause(draft.conditions.payment)}</p>
          {adjustment ? <p>{adjustment}</p> : null}
          {draft.conditions.delayClause ? <p>{delayClauseText}</p> : null}
        </div>
      {draft.extras ? <PreviewSection title="Extras">{draft.extras}</PreviewSection> : null}
        <div className="mt-10 flex items-center justify-between border-t border-[#ded8cf] pt-3 font-enriq text-[11px] uppercase tracking-[0.18em] text-[#111]">
          <p>los@drama.com.ar</p>
          <p>{budgetBrand.website}</p>
        </div>
      </div>
    </div>
  )
}

function PreviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="mt-7"><h3 className="gradient-bg mb-3 inline-flex rounded-full px-3 py-1.5 font-enriq text-[11px] font-black uppercase tracking-[0.16em] text-black">{title}</h3><div className="ml-3 space-y-2 text-sm leading-relaxed">{children}</div></section>
}

function PreviewBullet({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2.5">
      <span className="gradient-bg mt-[0.45em] h-2 w-2 shrink-0 rounded-full" />
      <span>{children}</span>
    </p>
  )
}

function PreviewServices({ services }: { services: ServiceItem[] }) {
  if (!services.length) return <p className="text-[#6f6b67]">Sin servicios cargados.</p>

  if (services.length <= 9) {
    return <>{services.map((service) => <PreviewBullet key={service.id}>{service.label}{service.free ? ' (sin cargo)' : ''}</PreviewBullet>)}</>
  }

  return (
    <div className="grid gap-x-8 gap-y-2 md:grid-cols-2">
      {splitBalanced(services).map((column, columnIndex) => (
        <div key={columnIndex} className="space-y-2">
          {column.map((service) => <PreviewBullet key={service.id}>{service.label}{service.free ? ' (sin cargo)' : ''}</PreviewBullet>)}
        </div>
      ))}
    </div>
  )
}

function formatPreviewDate(value: string) {
  if (!value) return ''
  return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(`${value}T00:00:00`))
}

function StoredList({ title, items, onOpen, onDelete, onDuplicate }: { title: string; items: BudgetDraft[]; onOpen: (item: BudgetDraft) => void; onDelete: (id: string) => void; onDuplicate: (item: BudgetDraft) => void }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <h2 className="font-black uppercase text-white">{title}</h2>
      <div className="mt-3 space-y-2">
        {items.length ? items.map((item) => (
          <div key={item.id} className="relative rounded-xl bg-black/35 p-3 pr-10">
            <button
              type="button"
              onClick={() => onDelete(item.id)}
              className="danger-x absolute right-2 top-2"
              aria-label={`Eliminar ${item.projectName || 'Sin proyecto'}`}
              title="Eliminar"
            >
              ×
            </button>
            <button onClick={() => onOpen(item)} className="block text-left text-sm font-bold text-white">{item.projectName || 'Sin proyecto'}</button>
            <p className="mt-1 text-xs text-white/35">{modalityLabel(item.modality)} · {item.date}</p>
            <div className="mt-2 flex gap-2">
              <button onClick={() => onDuplicate(item)} className="mini">Duplicar</button>
            </div>
          </div>
        )) : <p className="text-sm text-white/25">Todavía no hay.</p>}
      </div>
    </div>
  )
}

function RowsEditor<T extends { id: string } & Record<string, any>>({ title, rows, columns, labels, onChange }: { title: string; rows: T[]; columns: string[]; labels: string[]; onChange: (rows: T[]) => void }) {
  return (
    <div className="space-y-3">
      <PanelTitle>{title}</PanelTitle>
      {rows.map((row, index) => (
        <div key={row.id} className="relative grid gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-3 pr-11 md:grid-cols-[1fr_180px]">
          {columns.map((column, columnIndex) => (
            <input key={column} value={row[column] ?? ''} type={column.includes('amount') || column === 'fee' ? 'number' : 'text'} placeholder={labels[columnIndex]} onChange={(event) => onChange(rows.map((item) => item.id === row.id ? { ...item, [column]: column.includes('amount') || column === 'fee' ? Number(event.target.value) : event.target.value } : item))} className="rounded-xl border border-white/10 bg-black px-3 py-2 text-white outline-none" />
          ))}
          <button
            type="button"
            onClick={() => onChange(rows.filter((_, i) => i !== index))}
            className="danger-x absolute right-2 top-1/2 -translate-y-1/2"
            aria-label={`Eliminar fila ${index + 1}`}
            title="Eliminar"
          >
            ×
          </button>
        </div>
      ))}
      <button onClick={() => onChange([...rows, { id: makeId('row'), [columns[0]]: '', [columns[1]]: 0 } as T])} className="rounded-xl bg-white px-4 py-2 text-sm font-black text-black">Agregar fila</button>
    </div>
  )
}

type StepProps = { draft: BudgetDraft; update: (changes: Partial<BudgetDraft>) => void }

function FieldGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2">{children}</div>
}

function PanelTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xs font-black uppercase tracking-[0.22em] text-white/35">{children}</h3>
}

function Input({ label, value, onChange, type = 'text', wide }: { label: string; value: string; onChange: (value: string) => void; type?: string; wide?: boolean }) {
  return <label className={`block ${wide ? 'md:col-span-2' : ''}`}><span className="mb-2 block text-xs font-black uppercase tracking-widest text-white/35">{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-white/10 bg-black px-3 py-3 text-white outline-none focus:border-white/30" /></label>
}

function Textarea({ label, value, onChange, rows }: { label: string; value: string; onChange: (value: string) => void; rows: number }) {
  return <label className="block"><span className="mb-2 block text-xs font-black uppercase tracking-widest text-white/35">{label}</span><textarea rows={rows} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-white/10 bg-black px-3 py-3 text-white outline-none focus:border-white/30" /></label>
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: [string, string][] }) {
  return <label className="block"><span className="mb-2 block text-xs font-black uppercase tracking-widest text-white/35">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-white/10 bg-black px-3 py-3 text-white outline-none">{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></label>
}

function createDraft(modality: BudgetModality): BudgetDraft {
  const now = new Date().toISOString()
  return {
    id: makeId(),
    status: 'draft',
    modality,
    currency: 'ARS',
    date: new Date().toISOString().slice(0, 10),
    client: { name: '' },
    projectName: '',
    services: [],
    notIncluded: [],
    investment: defaultInvestment(modality),
    conditions: defaultConditions(modality),
    createdAt: now,
    updatedAt: now,
  }
}

function defaultInvestment(modality: BudgetModality): BudgetDraft['investment'] {
  if (modality === 'fixed') return { type: 'fixed-options', options: [{ id: makeId('option'), label: 'Opción 1', amount: 0 }] }
  return { type: 'monthly-total', total: 0 }
}

function defaultConditions(modality: BudgetModality): BudgetDraft['conditions'] {
  return {
    validity: { type: 'days', value: 20 },
    adjustment: modality === 'monthly' ? { type: 'bimonthly-ipc', untilSeasonEnd: true } : { type: 'none' },
    payment: modality === 'monthly' ? { type: 'monthly-1-5' } : { type: 'deposit', percentage: 30 },
    delayClause: false,
  }
}

function getTotal(draft: BudgetDraft) {
  const investment = draft.investment
  if (investment.type === 'monthly-total') return investment.total
  if (investment.type === 'monthly-breakdown') return investment.rows.reduce((sum, row) => sum + Number(row.fee || 0), 0)
  return investment.options.reduce((sum, option) => sum + Number(option.amount || 0), 0)
}

function modalityLabel(value: BudgetModality) {
  return value === 'monthly' ? 'Abono mensual' : 'Proyecto cerrado'
}

function normalizeLegacyDraft(draft: BudgetDraft): BudgetDraft {
  const legacyDraft = draft as unknown as Omit<BudgetDraft, 'modality' | 'investment'> & {
    modality?: string
    investment?: {
      type: string
    } | {
      type: 'stages'
      stages: { fee?: number }[]
    }
  }

  if (legacyDraft.modality !== 'stages' && legacyDraft.investment?.type !== 'stages') return draft

  const total = legacyDraft.investment?.type === 'stages' && 'stages' in legacyDraft.investment
    ? legacyDraft.investment.stages.reduce((sum, stage) => sum + Number(stage.fee || 0), 0)
    : 0

  return {
    ...draft,
    modality: 'fixed',
    investment: {
      type: 'fixed-options',
      options: [{ id: makeId('option'), label: 'Inversión', amount: total }],
    },
    conditions: defaultConditions('fixed'),
  }
}

function compactDate(value: string) {
  const date = value || new Date().toISOString().slice(0, 10)
  const [year, month, day] = date.split('-')
  return `${day}-${month}-${year}`
}

function splitBalanced<T>(items: T[]) {
  const firstColumnCount = Math.ceil(items.length / 2)
  return [items.slice(0, firstColumnCount), items.slice(firstColumnCount)]
}

function hasSelectedService(services: ServiceItem[], id: string) {
  return services.some((item) => item.id === id || item.mergedFrom?.includes(id))
}

function removeServiceById(services: ServiceItem[], id: string) {
  return normalizeMergedServices(services.flatMap((item) => {
    if (item.id === id) return []
    if (!item.mergedFrom?.includes(id)) return [item]

    const remainingMergedIds = item.mergedFrom.filter((mergedId) => mergedId !== id)
    return remainingMergedIds.map((mergedId) => ({
      id: mergedId,
      label: identityServiceLabel(mergedId),
      source: 'catalog' as const,
    }))
  }))
}

function normalizeMergedServices(services: ServiceItem[]) {
  const selectedIdentityIds = identityMergeIds.filter((id) => hasSelectedService(services, id))
  const withoutIdentityGroup = services.filter((item) => {
    if (identityMergeIds.includes(item.id)) return false
    return !item.mergedFrom?.some((id) => identityMergeIds.includes(id))
  })

  if (selectedIdentityIds.length <= 1) {
    const singleIdentity = selectedIdentityIds.map((id) => ({
      id,
      label: identityServiceLabel(id),
      source: 'catalog' as const,
    }))
    return insertIdentityService(services, withoutIdentityGroup, singleIdentity)
  }

  const mergedService = {
    id: 'identidad-visual-merged',
    label: `${joinSpanishList(sortIdentityLabels(selectedIdentityIds).map((id) => identityMergeLabels[id]))} de identidad visual`,
    source: 'catalog' as const,
    mergedFrom: selectedIdentityIds,
  }

  return insertIdentityService(services, withoutIdentityGroup, [mergedService])
}

function insertIdentityService(original: ServiceItem[], withoutIdentityGroup: ServiceItem[], identityServices: ServiceItem[]) {
  if (!identityServices.length) return withoutIdentityGroup
  return [...identityServices, ...withoutIdentityGroup]
}

function identityServiceLabel(id: string) {
  if (id === 'identidad-0') return 'Creación de identidad visual'
  if (id === 'identidad-1') return 'Gestión de identidad visual'
  return 'Rediseño de identidad visual'
}

function joinSpanishList(items: string[]) {
  if (items.length <= 1) return items[0] || ''
  if (items.length === 2) return `${items[0]} y ${items[1]}`
  return `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`
}

function sortIdentityLabels(ids: string[]) {
  return [...ids].sort((a, b) => identityMergeLabelOrder.indexOf(a) - identityMergeLabelOrder.indexOf(b))
}

async function downloadBudgetPdf(draft: BudgetDraft, filename: string) {
  const { pdf } = await import('@react-pdf/renderer')
  const { default: BudgetPDF } = await import('./BudgetPDF')
  const blob = await pdf(createElement(BudgetPDF, { data: draft }) as any).toBlob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function money(amount: number, currency: string) {
  return `${currency} ${new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(Number(amount || 0))}`
}
