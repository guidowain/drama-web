import React from 'react'
import {
  Document,
  Font,
  Image,
  Page,
  Path,
  StyleSheet,
  Svg,
  Text,
  View,
  renderToFile,
} from '@react-pdf/renderer'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const h = React.createElement
const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const outDir = resolve(root, 'deliverables')
const outFile = resolve(outDir, 'toma-soy-luna-notas-drama.pdf')
const gradientHeaderPath = resolve(root, 'public/brand/drama-gradient-header.png')

mkdirSync(outDir, { recursive: true })

Font.register({
  family: 'Archivo',
  fonts: [
    { src: resolve(root, 'public/fonts/archivo/ArchivoRegular.ttf'), fontWeight: 400 },
    { src: resolve(root, 'public/fonts/archivo/ArchivoBold.ttf'), fontWeight: 700 },
  ],
})

Font.register({
  family: 'Enriq',
  fonts: [
    { src: resolve(root, 'public/fonts/enriq/ENRIQRegular.ttf'), fontWeight: 400 },
    { src: resolve(root, 'public/fonts/enriq/ENRIQBold.ttf'), fontWeight: 700 },
    { src: resolve(root, 'public/fonts/enriq/ENRIQBlack.ttf'), fontWeight: 900 },
  ],
})

const gradient = ['#F504FF', '#FE8B97', '#FE796D', '#FCC028', '#FED791']

function MeshBackground() {
  return h(
    View,
    { style: styles.background, fixed: true },
    h(Image, { src: gradientHeaderPath, style: styles.headerGradient }),
    h(Svg, { style: styles.backgroundSvg, viewBox: '0 0 842 595' }, h(Path, { d: 'M0 0h842v595H0z', fill: '#090909' }), h(Path, {
      d: 'M-80 388C92 296 202 302 356 392c174 102 285 89 566-68v271H-80z',
      fill: gradient[2],
      opacity: 0.15,
    }), h(Path, {
      d: 'M542-110c118 24 214 99 242 204 24 91-5 178-85 259-64 64-169 79-240 26-73-55-69-154-43-240 29-95 55-208 126-249z',
      fill: gradient[0],
      opacity: 0.12,
    })),
    h(Image, { src: gradientHeaderPath, style: styles.headerGradient }),
  )
}

function Bullet({ children }) {
  return h(View, { style: styles.bulletRow }, h(Text, { style: styles.bulletMark }, '•'), h(Text, { style: styles.bulletText }, children))
}

function Panel({ label, title, children, accent = false }) {
  return h(
    View,
    { style: [styles.panel, accent && styles.panelAccent] },
    h(Text, { style: [styles.label, accent && styles.labelDark] }, label),
    h(Text, { style: [styles.panelTitle, accent && styles.panelTitleDark] }, title),
    h(View, { style: styles.panelContent }, children),
  )
}

function BriefPdf() {
  return h(
    Document,
    { title: 'Toma Soy Luna - Notas Drama', author: 'Drama' },
    h(
      Page,
      { size: 'A4', orientation: 'landscape', style: styles.page },
      h(MeshBackground),
      h(
        View,
        { style: styles.header },
        h(View, null, h(Text, { style: styles.kicker }, 'Brief de toma'), h(Text, { style: styles.title }, 'Toma Soy Luna')),
        h(Text, { style: styles.headerNote }, 'Estilo Drama · gradiente sin logo'),
      ),
      h(
        View,
        { style: styles.grid },
        h(
          Panel,
          { label: '01', title: 'Encuadre y cámara' },
          h(Bullet, null, 'Las fotos deben ser principalmente en plano americano.'),
          h(Bullet, null, 'Respetar la altura de cámara de la foto anterior de Karol.'),
          h(Bullet, null, 'Usar una distancia focal aproximada de 70 mm.'),
          h(Bullet, null, 'La luz debe ser similar a la anterior foto de Karol.'),
        ),
        h(
          Panel,
          { label: '02', title: 'Look y continuidad' },
          h(Bullet, null, 'Matchear los colores de las demás fotos aprobadas.'),
          h(Bullet, null, 'No usar atuendos color violeta o azul, ya que son los colores del fondo.'),
          h(Bullet, null, 'Priorizar coherencia de piel, contraste y temperatura con las referencias aprobadas.'),
        ),
        h(
          Panel,
          { label: '03', title: 'Foto principal', accent: true },
          h(Bullet, null, 'Idealmente, incluir un micrófono en su mano a la altura del torso.'),
          h(Bullet, null, 'Evitar que la mano quede colgando al lado de la cadera.'),
          h(Bullet, null, 'Chequear que el codo no se separe del cuerpo.'),
        ),
      ),
      h(
        View,
        { style: styles.bottom },
        h(
          Panel,
          { label: '04', title: 'Opciones a cubrir' },
          h(Bullet, null, 'Primeros planos de frente.'),
          h(Bullet, null, 'Primeros planos en 3/4 perfil.'),
          h(Bullet, null, 'Fotos sin micrófono.'),
          h(Bullet, null, 'Diferentes gestos a cámara.'),
        ),
        h(
          View,
          { style: styles.callout },
          h(Text, { style: styles.calloutTitle }, 'Objetivo visual'),
          h(
            Text,
            { style: styles.calloutText },
            'Mantener una lectura integrada con las fotos aprobadas: misma energía de luz, color y cámara, con una pose principal más activa y cuidada alrededor del micrófono.',
          ),
        ),
      ),
    ),
  )
}

const styles = StyleSheet.create({
  page: {
    position: 'relative',
    padding: 30,
    backgroundColor: '#090909',
    color: '#FFFFFF',
    fontFamily: 'Archivo',
  },
  background: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
  },
  backgroundSvg: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
  },
  headerGradient: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: 112,
  },
  header: {
    height: 104,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  kicker: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.8,
    color: '#151515',
    fontWeight: 700,
  },
  title: {
    marginTop: 6,
    fontFamily: 'Enriq',
    fontSize: 51,
    lineHeight: 0.9,
    color: '#121212',
    fontWeight: 900,
  },
  headerNote: {
    marginTop: 7,
    fontSize: 10,
    color: '#151515',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: 700,
  },
  grid: {
    flexDirection: 'row',
    gap: 14,
  },
  bottom: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 14,
  },
  panel: {
    flex: 1,
    minHeight: 164,
    borderRadius: 8,
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.075)',
    border: '1px solid rgba(255, 255, 255, 0.16)',
  },
  panelAccent: {
    backgroundColor: '#FED791',
    color: '#111111',
    border: '1px solid rgba(255, 255, 255, 0)',
  },
  label: {
    fontFamily: 'Enriq',
    fontSize: 13,
    color: '#FCC028',
    fontWeight: 700,
  },
  labelDark: {
    color: '#F504FF',
  },
  panelTitle: {
    marginTop: 6,
    marginBottom: 8,
    fontFamily: 'Enriq',
    fontSize: 22,
    lineHeight: 1,
    fontWeight: 700,
    color: '#FFFFFF',
  },
  panelTitleDark: {
    color: '#111111',
  },
  panelContent: {
    gap: 5,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletMark: {
    width: 10,
    fontSize: 12,
    lineHeight: 1.35,
    color: '#FE8B97',
  },
  bulletText: {
    flex: 1,
    fontSize: 10.4,
    lineHeight: 1.35,
    color: 'inherit',
  },
  callout: {
    width: 284,
    borderRadius: 8,
    padding: 17,
    backgroundColor: '#FFFFFF',
    color: '#111111',
  },
  calloutTitle: {
    fontFamily: 'Enriq',
    fontSize: 23,
    lineHeight: 1,
    fontWeight: 700,
  },
  calloutText: {
    marginTop: 10,
    fontSize: 11.4,
    lineHeight: 1.45,
    color: '#302C2C',
  },
})

await renderToFile(h(BriefPdf), outFile)
console.log(outFile)
