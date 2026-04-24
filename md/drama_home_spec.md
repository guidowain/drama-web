# DRAMA — HOME SPEC

## GLOBAL

- **Tipo de sitio:** Landing page principal del sitio
- **Objetivo principal:** Conversión a contacto (WhatsApp / formulario)
- **Estética base:**
  - Fondo: #000000
  - Logo principal del sitio: `public/logos/logo-byn-invertido.png`
  - Gradiente principal:
    usar el gradiente canónico definido en `drama_master.md`
  - Uso intensivo de:
    - blur (backdrop-filter)
    - transparencias
    - animaciones continuas
- **Tipografía:**
  - Font family: "Enriq Round Sans Serif"
  - Fallback: system-ui, sans-serif
  - Carga: vía @font-face o servicio externo provisto

## 1. HEADER (FIXED)

### Layout
- position: fixed
- top: 0
- width: 100%
- height:
  - desktop: 72px
  - mobile: 64px
- z-index: 1000

### Fondo
- background: rgba(0,0,0,0.85)
- backdrop-filter: blur(10px)

### Contenido
#### Izquierda
- Logo principal: `public/logos/logo-byn-invertido.png`
- Archivo real a usar en esta instancia
- Formato: PNG
- height: 28px

#### Derecha (orden exacto)
1. Instagram icon (24x24)
2. WhatsApp icon (24x24)
3. Mail icon (24x24)
4. Hamburger menu

### Espaciado
- padding horizontal:
  - desktop: 32px
  - mobile: 20px
- gap íconos: 16px

### Links
- usar links definidos en `drama_master.md`

### Implementación
- los íconos deben ser links reales (`<a>` o `Link`)
- incluir labels accesibles (`aria-label`)
- evitar íconos clickeables sin href

### Interacción
- hover:
  - opacity: 0.7 → 1
  - transform: scale(1.05)
  - transition: 0.2s ease

## 2. HERO

### 2.1 VIDEO

### Propiedades
- autoplay: true
- muted: true
- loop: true
- controls: false
- playsinline: true

### Implementación
- el video del hero es decorativo
- no debe reemplazar contenido semántico
- incluir fallback visual estático si el video no carga
- el video debe poder ser definido desde CMS
- fallback local: `/public/video/hero.mp4`

### 2.2 SEO TEXTO (oculto parcial, accesible)

- Incluir un H1 real en HTML (no solo visual):
  "Agencia de diseño y comunicación para entretenimiento en Buenos Aires"

- Este H1 puede estar visualmente minimizado (no protagonista), pero debe existir en el DOM.

- Este H1 no debe competir con el claim visual principal.

- Agregar un párrafo descriptivo corto debajo del hero:
  "DRAMA es una agencia especializada en diseño y comunicación para teatro y entretenimiento, creando identidades visuales y campañas para espectáculos."

- Este texto puede:
  - tener tamaño de fuente reducido
  - menor opacidad (ej: 0.6–0.8)
  - integrarse al layout sin romper estética

- NO usar:
  - display: none
  - visibility: hidden

- Objetivo: mantener estética limpia pero aportar contenido indexable real para SEO.

#### Desktop
- aspect-ratio: 16 / 9
- width: 100%

#### Mobile
- aspect-ratio: 1 / 1
- mismo video (no cambiar asset)
- crop mediante:
  - object-fit: cover
  - centrado visual

### 2.3 PLACA GRADIENTE

#### Dimensiones
- height: 35–40vh
- width: 100%

#### Fondo
- usar versión simplificada del gradiente definido en master
- no redefinir colores en este archivo

#### Interacción hover (desktop)
- el gradiente responde al mouse:
  - background-position dinámico en base a cursor X/Y
  - efecto tipo “gradient follow”

### Contenido

#### Claim visual principal
- "LA HISTORIA DEBAJO DEL ESCENARIO."
- color: #FFFFFF
- weight: bold
- size:
  - desktop: 56px aprox
  - mobile: 32px aprox
- alineación: centrado

#### Rueda izquierda
- forma: círculo
- diámetro: 120–160px
- texto circular repetido
- animation:
  - rotate 20s linear infinite

#### Posicionamiento
- rueda parcialmente fuera del viewport (lado izquierdo)
- texto centrado vertical y horizontalmente en la placa

## 3. TICKER TEXTO

### Layout
- height: 36px
- width: 100%
- overflow: hidden

### Fondo
- #000000

### Texto
- color: #FFFFFF
- uppercase
- contenido:
  "COMUNICACIÓN Y DISEÑO PARA ENTRETENIMIENTO •" repetido en loop

### Animación
- scroll horizontal infinito (right → left)
- velocidad: media
- sin cortes visibles (loop perfecto)

### Implementación
- reutilizar este mismo componente en otras páginas donde corresponda
- no duplicar lógica de animación

## 4. CARDS SERVICIOS

### Layout general
- display: grid
- desktop: 2 columnas
- mobile: 1 columna
- gap: 24–32px
- padding lateral alineado con header

### SEO / contexto
- agregar una línea breve visible antes de las cards:
  "Servicios de diseño y comunicación para espectáculos, teatro y entretenimiento."
- este texto debe estar en HTML real

### 4.1 CARD (FRONT)

#### Estilo (liquid glass)
- background: rgba(255,255,255,0.08)
- backdrop-filter: blur(20px)
- border: 1px solid rgba(255,255,255,0.15)
- border-radius: 24px
- box-shadow: suave

#### Contenido
- icono superior
- título:
  DISEÑO / COMUNICACIÓN
- botón circular con "+" en esquina inferior derecha

### 4.2 INTERACCIÓN 3D

#### Contenedor
- perspective: 1000px

#### Flip
- hover:
  - transform: rotateY(180deg)
  - transition: 0.6s ease
- preserve-3d

### BACK (cara trasera)

#### Fondo
- negro semi-transparente

#### Contenido

##### DISEÑO
- Diseño gráfico
- Edición de videos
- Animaciones
- Webs
- Fotografía
- Retoque fotográfico
- Branding
- AI
- 3D

##### COMUNICACIÓN
- Redes sociales
- Estrategia
- Creatividad
- Pauta publicitaria
- SEO
- Email marketing

### Layout contenido BACK
- por defecto: 1 columna
- si no entra en altura:
  - usar 2 columnas internas
- gap columnas: 16–24px
- no reducir demasiado font-size

## 5. TICKER LOGOS

### Layout
- width: 100%
- overflow: hidden
- fondo: gris claro / blanco roto

### Logos
- escala de grises
- altura uniforme: 40–60px

### Animación
- scroll horizontal infinito
- loop continuo sin cortes

### Implementación
- idealmente reutilizable como componente independiente
- priorizar performance y loop sin saltos

## 6. BOTÓN PROYECTOS DESTACADOS

### Ubicación
- debajo del ticker de logos
- centrado

### Estilo
- background: gradient principal
- border-radius: 999px
- padding: 14px 32px
- texto: blanco, uppercase

### Interacción
- hover:
  - scale: 1.05
  - leve shift del gradiente

### Acción
- navegación a `/proyectos`
- debe implementarse como link real

## 7. BLOQUE CONTACTO

### Layout
- desktop: 3 columnas
- mobile: 1 columna

### Izquierda
- texto:
  ESCRIBINOS, NO HAY DRAMA
- alineación izquierda

### Centro (formulario)

#### Campos
- Nombre
- Apellido
- Email
- Mensaje

#### Inputs
- background: gris claro
- border-radius: 8–12px
- padding interno cómodo

#### Botón
- width: 100%
- background: #000000
- color: #FFFFFF

### Derecha
- Instagram
- WhatsApp
- Mail

- usar links definidos en `drama_master.md`

### Implementación
- formulario con campos reales y labels accesibles
- Instagram y WhatsApp deben ser links reales
- evitar texto o íconos sin enlace

## SEO

- esta página debe aportar contexto de marca y servicios

### Metadata
- definir:
  - title
  - meta description

### Implementación
- usar estructura semántica correcta (h1, h2, p, nav)
- evitar texto importante dentro de imágenes o solo dentro del video
- asegurar render HTML indexable

## 8. CIERRE

- fondo negro o gradiente suave
- sin contenido adicional obligatorio

## COMPORTAMIENTOS GENERALES

- scroll suave (scroll-behavior: smooth)
- animaciones fluidas (no abruptas)
- uso constante de movimiento:
  - video
  - ticker texto
  - ticker logos
  - rotación rueda
  - hover dinámico en gradiente
  - flip 3D cards


## DECISIONES CLAVE
- home visualmente limpio, pero con contenido HTML indexable
- H1 real minimizado, claim visual protagonista
- navegación interna hacia páginas reales
- sistema de gradiente coherente con el resto del sitio
- componentes reutilizables donde corresponda
