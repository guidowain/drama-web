import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer'
import { budgetBrand } from '@/lib/presupuestador/brand'
import { delayClauseText, renderAdjustmentClause, renderPaymentClause, renderValidity } from '@/lib/presupuestador/clauses'
import type { BudgetDraft, FixedInvestment, MonthlyInvestment } from '@/lib/presupuestador/types'

const HEADER_WIDTH = 511
const HEADER_HEIGHT = 95
const TOTAL_WIDTH = 475
const TOTAL_GRADIENT_HEIGHT = 5
const LABEL_HEIGHT = 18
const HEADER_GRADIENT_SRC = '/brand/drama-gradient-header.png'
const STRIP_GRADIENT_SRC = '/brand/drama-gradient-strip.png'
const PILL_GRADIENT_SRC = '/brand/drama-gradient-pill.png'
const DOT_GRADIENT_SRC = '/brand/drama-gradient-dot.png'

Font.register({
  family: 'Archivo',
  fonts: [
    { src: '/fonts/archivo/ArchivoRegular.ttf', fontWeight: 400 },
    { src: '/fonts/archivo/ArchivoBold.ttf', fontWeight: 700 },
  ],
})

Font.register({
  family: 'Enriq',
  fonts: [
    { src: '/fonts/enriq/ENRIQRegular.ttf', fontWeight: 400 },
    { src: '/fonts/enriq/ENRIQBold.ttf', fontWeight: 700 },
    { src: '/fonts/enriq/ENRIQBlack.ttf', fontWeight: 900 },
  ],
})

Font.registerHyphenationCallback((word) => [word])

const styles = StyleSheet.create({
  page: {
    padding: 0,
    backgroundColor: '#fffdf8',
    color: budgetBrand.colors.ink,
    fontFamily: 'Archivo',
    fontWeight: 400,
    fontSize: 10,
    lineHeight: 1.45,
  },
  shell: {
    flex: 1,
    backgroundColor: '#fffdf8',
    borderRadius: 0,
    overflow: 'hidden',
  },
  header: {
    width: HEADER_WIDTH,
    height: HEADER_HEIGHT,
    marginTop: 34,
    alignSelf: 'center',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: HEADER_WIDTH,
    height: HEADER_HEIGHT,
  },
  logo: { width: 104, height: 'auto' },
  meta: {
    color: '#76716d',
    textAlign: 'right',
    fontSize: 8,
    letterSpacing: 0.4,
  },
  titleMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  body: {
    paddingTop: 20,
    paddingRight: 36,
    paddingBottom: 40,
    paddingLeft: 36,
  },
  eyebrow: {
    color: '#76716d',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontFamily: 'Enriq',
    fontSize: 7.2,
  },
  client: {
    color: '#76716d',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    fontFamily: 'Enriq',
    fontSize: 7.5,
  },
  project: {
    fontFamily: 'Enriq',
    fontSize: 32,
    fontWeight: 900,
    lineHeight: 0.95,
    marginTop: 7,
    marginBottom: 17,
    textTransform: 'uppercase',
  },
  intro: {
    fontSize: 12.2,
    fontWeight: 400,
    color: '#211f1d',
    marginBottom: 16,
    maxWidth: 440,
  },
  section: { marginBottom: 14 },
  sectionTitle: {
    fontFamily: 'Enriq',
    fontSize: 7.6,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: '#050505',
    fontWeight: 900,
    lineHeight: 1,
  },
  sectionPill: {
    alignSelf: 'flex-start',
    height: LABEL_HEIGHT,
    borderRadius: LABEL_HEIGHT / 2,
    paddingTop: 5,
    paddingRight: 9,
    paddingLeft: 9,
    marginBottom: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  sectionLabelGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: LABEL_HEIGHT,
  },
  sectionContent: {
    marginLeft: 10,
  },
  unlabelledSection: {
    marginTop: 14,
    marginBottom: 14,
    marginLeft: 10,
  },
  paragraph: { fontSize: 10, fontWeight: 400, color: '#2a2927' },
  bullet: { flexDirection: 'row', gap: 7, marginBottom: 4.5, alignItems: 'flex-start' },
  bulletDot: { width: 6.5, height: 6.5, marginTop: 3.6 },
  bulletText: { flex: 1, fontSize: 9.8, fontWeight: 400, color: '#23211f' },
  servicesColumns: {
    flexDirection: 'row',
    gap: 18,
  },
  servicesColumn: {
    flex: 1,
  },
  table: {
    border: '1px solid #171717',
    borderRadius: 10,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row' },
  cell: {
    flex: 1,
    padding: 8.5,
    borderRight: '1px solid #171717',
    borderBottom: '1px solid #171717',
  },
  headCell: {
    backgroundColor: '#050505',
    color: '#ffffff',
    fontFamily: 'Enriq',
    fontSize: 7.5,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  totalBox: {
    marginTop: 17,
    marginBottom: 17,
    backgroundColor: '#050505',
    color: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  totalGradient: {
    width: TOTAL_WIDTH,
    height: TOTAL_GRADIENT_HEIGHT,
  },
  totalContent: {
    paddingTop: 12,
    paddingRight: 16,
    paddingBottom: 12,
    paddingLeft: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontFamily: 'Enriq',
    fontSize: 8,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    lineHeight: 1,
  },
  totalAmount: {
    fontFamily: 'Enriq',
    fontSize: 24,
    fontWeight: 900,
    lineHeight: 1,
  },
  conditions: { color: budgetBrand.colors.muted, fontSize: 9.3, fontWeight: 400, lineHeight: 1.35 },
  footer: {
    position: 'absolute',
    left: 60,
    right: 60,
    bottom: 34,
    borderTop: '1px solid #ded8cf',
    paddingTop: 7,
    flexDirection: 'row',
    justifyContent: 'space-between',
    color: '#050505',
    fontFamily: 'Enriq',
    fontSize: 7.5,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
})

export default function BudgetPDF({ data }: { data: BudgetDraft }) {
  const adjustment = renderAdjustmentClause(data.conditions.adjustment)
  const investment = data.investment

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.shell}>
          <View style={styles.header}>
            <HeaderGradient />
            <Image src={budgetBrand.logoPath} style={styles.logo} />
          </View>

            <View style={styles.body}>
            <View style={styles.titleMetaRow}>
              <Text style={styles.client}>
                {data.client.name || 'Solicitante'}
                {data.client.company ? ` / ${data.client.company}` : ''}
              </Text>
              <Text style={styles.meta}>{formatDate(data.date)}</Text>
            </View>
            <Text style={styles.project}>{data.projectName || 'Nombre del proyecto'}</Text>

            {data.opening ? <Text style={styles.intro}>{data.opening}</Text> : null}
            {data.understanding ? <Section title="Entendimiento del proyecto"><Text style={styles.paragraph}>{data.understanding}</Text></Section> : null}

            <Section title="Servicios">
              <ServicesList services={data.services} />
            </Section>

            {data.notIncluded?.length ? (
              <Section title="No incluye">
                {data.notIncluded.map((item, index) => (
                  <View key={`${item}-${index}`} style={styles.bullet}>
                    <GradientBullet />
                    <Text style={styles.bulletText}>{item}</Text>
                  </View>
                ))}
              </Section>
            ) : null}

            <InvestmentSummary data={data} />

            {data.modality === 'fixed' && data.deliveryNote ? <Section title="Plazo de entrega"><Text style={styles.paragraph}>{data.deliveryNote}</Text></Section> : null}

            <View style={styles.unlabelledSection}>
              <Text style={styles.conditions}>{renderValidity(data.conditions.validity)}</Text>
              <Text style={styles.conditions}>{renderPaymentClause(data.conditions.payment)}</Text>
              {adjustment ? <Text style={styles.conditions}>{adjustment}</Text> : null}
              {data.conditions.delayClause ? <Text style={styles.conditions}>{delayClauseText}</Text> : null}
            </View>

            {data.extras ? <Section title="Extras / aclaraciones"><Text style={styles.conditions}>{data.extras}</Text></Section> : null}
          </View>

          <View style={styles.footer}>
            <Text>los@drama.com.ar</Text>
            <Text>{budgetBrand.website}</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}

function HeaderGradient() {
  return <Image src={HEADER_GRADIENT_SRC} style={styles.headerGradient} />
}

function AccentGradient() {
  return <Image src={STRIP_GRADIENT_SRC} style={styles.totalGradient} />
}

function GradientBullet() {
  return <Image src={DOT_GRADIENT_SRC} style={styles.bulletDot} />
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const labelWidth = sectionLabelWidth(title)

  return (
    <View style={styles.section}>
      <View style={[styles.sectionPill, { width: labelWidth }]}>
        <LabelGradient width={labelWidth} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  )
}

function LabelGradient({ width }: { width: number }) {
  return <Image src={PILL_GRADIENT_SRC} style={[styles.sectionLabelGradient, { width }]} />
}

function sectionLabelWidth(title: string) {
  const widths: Record<string, number> = {
    'Entendimiento del proyecto': 182,
    Servicios: 86,
    'No incluye': 98,
    'Plazo de entrega': 138,
    Condiciones: 118,
    'Extras / aclaraciones': 168,
  }

  return widths[title] || Math.max(90, (title.length * 7.2) + 22)
}

function InvestmentSummary({ data }: { data: BudgetDraft }) {
  const investment = data.investment

  if (investment.type === 'monthly-total') return <Total amount={investment.total} label="Inversión mensual" currency={data.currency} />
  if (investment.type === 'monthly-breakdown') return <Total amount={investment.rows.reduce((sum, row) => sum + Number(row.fee || 0), 0)} label="Inversión mensual" currency={data.currency} />
  return <Total amount={investment.options.reduce((sum, option) => sum + Number(option.amount || 0), 0)} label="Inversión" currency={data.currency} />
}

function ServicesList({ services }: { services: BudgetDraft['services'] }) {
  if (!services.length) return <Text style={styles.conditions}>Sin servicios cargados.</Text>

  if (services.length <= 9) {
    return (
      <View>
        {services.map((service, index) => <ServiceBullet key={service.id} service={service} index={index} />)}
      </View>
    )
  }

  const columns = splitBalanced(services)
  return (
    <View style={styles.servicesColumns}>
      {columns.map((column, columnIndex) => (
        <View key={columnIndex} style={styles.servicesColumn}>
          {column.map((service, index) => <ServiceBullet key={service.id} service={service} index={(columnIndex * 100) + index} />)}
        </View>
      ))}
    </View>
  )
}

function ServiceBullet({ service, index }: { service: BudgetDraft['services'][number]; index: number }) {
  return (
    <View style={styles.bullet}>
      <GradientBullet />
      <Text style={styles.bulletText}>{service.label}{service.free ? ' (sin cargo)' : ''}</Text>
    </View>
  )
}

function MonthlyInvestmentView({ investment, currency }: { investment: MonthlyInvestment; currency: string }) {
  if (investment.type === 'monthly-total') {
    return <Total amount={investment.total} label="Inversión mensual" currency={currency} />
  }

  return (
    <View>
      <Table headers={['Servicio', 'Modalidad', 'Honorario']} rows={investment.rows.map((row) => [row.service, row.modality, money(row.fee, currency)])} />
      <Total amount={investment.rows.reduce((sum, row) => sum + Number(row.fee || 0), 0)} label="Inversión mensual" currency={currency} />
    </View>
  )
}

function FixedInvestmentView({ investment, currency }: { investment: FixedInvestment; currency: string }) {
  const total = investment.options.reduce((sum, option) => sum + Number(option.amount || 0), 0)

  return (
    <View>
      <Table headers={['Opción', 'Monto']} rows={investment.options.map((option) => [option.label, money(option.amount, currency)])} />
      <Total amount={total} label="Inversión" currency={currency} />
    </View>
  )
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <View style={styles.table}>
      <View style={styles.row}>{headers.map((header) => <Text key={header} style={[styles.cell, styles.headCell]}>{header}</Text>)}</View>
      {rows.map((row, index) => (
        <View key={index} style={styles.row}>
          {row.map((cell, cellIndex) => <Text key={`${index}-${cellIndex}`} style={styles.cell}>{cell}</Text>)}
        </View>
      ))}
    </View>
  )
}

function Total({ amount, label, currency }: { amount: number; label: string; currency: string }) {
  return (
    <View style={styles.totalBox}>
      <AccentGradient />
      <View style={styles.totalContent}>
        <Text style={styles.totalLabel}>{label}</Text>
        <Text style={styles.totalAmount}>{money(amount, currency)}</Text>
      </View>
    </View>
  )
}

function splitBalanced<T>(items: T[]) {
  const firstColumnCount = Math.ceil(items.length / 2)
  return [items.slice(0, firstColumnCount), items.slice(firstColumnCount)]
}

export function money(amount: number, currency: string) {
  return `${currency} ${new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(Number(amount || 0))}`
}

function formatDate(value: string) {
  if (!value) return ''
  return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(`${value}T00:00:00`))
}
