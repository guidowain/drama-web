# DRAMA — PROYECTOS DESTACADOS

## GLOBAL
- Fondo: #000
- Tipografía: "Enriq Round Sans Serif"
- UX: grilla + modal fullscreen-ish + páginas reales por proyecto
- La experiencia visual principal sigue siendo modal desde la grilla
- Cada proyecto debe tener también URL real e indexable
- La grilla funciona como punto de entrada UX, no como única vía de acceso

## HEADER
- Igual HOME (fixed, blur)

## HERO
- Fondo:
  - usar versión simplificada del gradiente definido en `drama_master.md`
  - no redefinir colores en este archivo
  - mantener menor intensidad que el home para no competir con el título
- Título: PROYECTOS DESTACADOS (negro, 72–96px desktop / 40–56px mobile)
- Sin filtros

## GRID
- Desktop: 2 columnas, gap 32x40
- Mobile: 1 columna, gap 32
- Padding: 64/32 (d), 48/20 (m)

## CARD
- Contenedor: #FFF, radius 24, padding 16
- Imagen: 1:1, object-fit: cover, radius 16
- Tags: pills oscuras, informativas
- Hover:
  - scale 1.02
  - box-shadow ↑
  - cursor pointer
- Click:
  - abre modal con animación 3D desde la card
  - actualiza la URL a `/proyectos/[slug]`
  - mantiene el contexto visual de la grilla mientras el modal está abierto

## APERTURA DE MODAL

### Comportamiento
- al abrirse un proyecto desde la grilla:
  - se abre el modal
  - se actualiza la URL con el slug real del proyecto
  - no se pierde el contexto visual de la grilla
  - el fondo queda bloqueado

### Objetivo
- mantener UX premium
- permitir compartir URL directa
- permitir indexación real en Google
- permitir back/forward del navegador

### Refresh / acceso directo
- si el usuario entra directo a `/proyectos/[slug]`
  - debe cargar la página individual completa del proyecto
  - no depender del estado previo del modal

### Back del navegador
- si el modal fue abierto desde la grilla
  - el botón back debe cerrar el modal y devolver a `/proyectos`

### Cierre manual
- al cerrar el modal con X o ESC:
  - cerrar overlay
  - volver a `/proyectos`
  - restaurar el contexto previo de scroll en la grilla

## SIN
- Flechas
- Filtros
- “Ver más”
- Modal como única forma de acceso al contenido

## SEO / IMPLEMENTACIÓN
- cada card debe implementarse con link real o equivalente semántico
- no usar solo divs clickeables
- cada proyecto debe existir también como página real en `/proyectos/[slug]`
- la grilla debe renderizar contenido HTML indexable

## FOOTER
- Simple, debajo de la grilla
