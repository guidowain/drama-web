# DRAMA — MASTER SPEC

## OBJETIVO
Documento base para trabajar con Claude sin perder coherencia entre páginas, UX y SEO.

Este archivo NO reemplaza los specs individuales.
Define reglas globales y cómo se conectan entre sí.

---

## ARQUITECTURA DEL SITIO

Rutas principales:

- /
- /proyectos
- /proyectos/[slug]
- /sobre-nosotros
- /contacto

Regla clave:
- TODA página importante debe tener URL real e indexable
- El modal es UX, no arquitectura

---

## STACK

- Framework: Next.js (App Router)
- Lenguaje: TypeScript
- Rendering: SSR/SSG (no SPA pura)
- Routing: rutas reales (`/`, `/proyectos`, `/proyectos/[slug]`, etc.)
- Estilos: Tailwind CSS
- Datos: consumo desde CMS (fuente de verdad)

---

## LÓGICA MODAL + PÁGINA

Sistema híbrido:

- Desde la grilla:
  → abre modal
  → actualiza URL (/proyectos/[slug])

- Entrada directa:
  → renderiza página completa

- Back:
  → cierra modal

Objetivo:
- UX premium
- SEO real
- URLs compartibles

---

## SEO GLOBAL

### Obligatorio en todas las páginas

- <title>
- <meta description>
- 1 H1 real en HTML
- contenido indexable (no solo visual)

---

### HOME (particularidad)

- H1 puede estar minimizado visualmente
- texto corto obligatorio
- NO ocultar con display:none

---

### PROYECTOS

- cada proyecto debe tener:
  - slug
  - seoTitle
  - seoDescription
  - excerpt

- contenido reutilizable (modal + página)

---

## SISTEMA VISUAL

### Fondo base
- negro (#000)

### Gradiente

Sistema pseudo-mesh:

- #F504FF
- #FE8B97
- #FE796D
- #FCC028
- #FED791

Reglas:
- evitar gradientes de 2 colores
- usar versiones simplificadas según contexto
- home: más rico
- internas: más calmo

- Este es el bloque canónico del gradiente.
- En los specs individuales NO redefinir colores.
- Referenciar: "usar gradiente definido en master".

---

### Tipografía

- "Enriq Round Sans Serif"
- fallback: system-ui

---

## COMPONENTES REUTILIZABLES

- Header
- Menu fullscreen
- Ticker texto
- Ticker logos
- Cards proyectos
- Modal proyecto

Regla:
- no duplicar lógica
- reutilizar siempre

---

## NAVEGACIÓN

- usar <nav>
- usar <a> o Link reales
- NO usar divs clickeables

---

## CONTACTO GLOBAL

Usar estos links en todo el sitio. No redefinir en specs individuales.

- Instagram: `https://instagram.com/drama.com.ar`
- WhatsApp: `https://wa.me/5491163357223`
- Mail: `mailto:los@drama.com.ar`

Regla:
- los specs individuales deben decir: "usar links definidos en master"

---

## CMS

Fuente de verdad del contenido.

### Rol
- centraliza todos los datos del sitio
- evita hardcode en frontend

### Consumo desde frontend
- el frontend consume datos vía:
  - JSON local (etapa inicial) o
  - API simple (futuro)

### Contrato de datos (mínimo)
- Definición canónica del modelo de datos. No duplicar este schema en otros specs.

Proyecto:
- id
- name
- slug
- year
- featured
- published
- tags[]
- coverImage
- contentBlocks[]
- seoTitle
- seoDescription
- excerpt

### Reglas
- contenido pensado para SEO desde origen
- reutilizable entre modal y página


---

## REGLAS DE CONTENIDO

- texto siempre en HTML
- evitar contenido dentro de imágenes
- evitar depender de animaciones

---

## ASSETS

### Imágenes
- ubicadas en `/public/images` o CMS
- usar alt text obligatorio

### Logos
- principal: `/public/logos/logo-byn-invertido.png`

### Video Hero
- fallback local: `/public/video/hero.mp4`
- versión final: definida desde CMS
- el video es decorativo (no contenido SEO)

---

## PERFORMANCE

Cuidado con:

- video hero
- blur
- animaciones simultáneas

- lazy loading en imágenes
- evitar videos pesados sin compresión

---

## PRIORIDADES

1. SEO correcto
2. UX consistente
3. Performance
4. Estética

---

## USO CON CLAUDE

Siempre pasar:

1. ESTE archivo (master)
2. + el spec específico

Ejemplo:
- master + home
- master + modal

---

## DECISIÓN FINAL

Este proyecto es:

- un portfolio premium
- pero pensado como negocio

Debe:

- verse increíble
- funcionar perfecto
- rankear en Google
