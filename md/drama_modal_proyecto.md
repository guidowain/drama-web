# DRAMA — MODAL PROYECTO

## CONCEPTO
- Overlay/modal que se abre desde la card
- Mantiene contexto visual (no reemplaza la página base)
- Casi fullscreen
- No es la única forma de acceso: cada proyecto existe también como página real

## DIMENSIONES
- Desktop: ~90vw x 90vh, centrado, radius 24
- Mobile: 100vw x 100dvh

## OVERLAY
- Fondo: rgba(0,0,0,0.7)
- Blur opcional

## ANIMACIÓN
- Entrada: scale + leve rotateY desde card
- 350–500ms, ease suave
- Salida: reversa

## CIERRE
- Botón “X” arriba derecha
- ESC (desktop)
- Mantener scroll previo

## CONTENIDO INTERNO

-### HERO
- Fondo:
  - usar versión simplificada del gradiente definido en `drama_master.md`
  - no redefinir colores en este archivo
  - mantener sobriedad para no competir con el contenido
- Título (negro)
- Tags (pills)
- Año

### Origen del contenido
- todo el contenido es CMS-driven
- reutilizado también en la página `/proyectos/[slug]`
- no definir contenido manual en este archivo
- Fondo:
  - usar versión simplificada del gradiente definido en `drama_master.md`
  - no redefinir colores en este archivo
  - mantener sobriedad para no competir con el contenido
- Título (negro)
- Tags (pills)
- Año

### MÓDULOS (CMS-driven)
Tipos:
- image
- imageText
- text

Reglas:
- La imagen manda
- object-fit: contain
- NO crop, NO deform
- Soporta vertical/horizontal/cuadrado/panorámico

### imageText
- Desktop: 2 columnas
- Alternancia automática (impar: img izq / par: img der)
- Mobile: 1 columna (img → texto)

### image
- Ocupa 2 columnas
- Centrada

### text
- 2 columnas
- ancho controlado

### CASOS
- Sin texto → imagen full
- Sin imagen → texto full

## INTERACCIÓN
- Sin lightbox interno
- Scroll vertical


## SEO / ACCESO

- el modal NO reemplaza la página real
- cada proyecto debe existir también como página en `/proyectos/[slug]`
- el contenido debe ser reutilizable entre modal y página
- el HTML debe ser indexable fuera del contexto del modal

## ESTADO URL

- El modal debe sincronizarse con la URL real del proyecto:
  - `/proyectos/[slug]`

### Comportamiento
- al abrir el modal desde la grilla:
  - actualizar URL a `/proyectos/[slug]`
  - mantener la página base (`/proyectos`) por debajo

- si el usuario entra directo a `/proyectos/[slug]`:
  - renderizar la página completa del proyecto (sin depender del modal)

- si el modal está abierto y el usuario navega con back:
  - cerrar el modal
  - volver a `/proyectos`

- al cerrar el modal manualmente (X o ESC):
  - volver a `/proyectos`
  - restaurar scroll previo

## FOOTER
- Opcional simple al final del contenido
