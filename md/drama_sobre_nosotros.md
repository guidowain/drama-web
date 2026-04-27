# DRAMA — SOBRE NOSOTROS (v1.0)

## GLOBAL
- Página: Sobre Nosotros
- Fondo base:
  - usar versión calmada del gradiente definido en `drama_master.md`
  - no redefinir colores en este archivo
  - mantener menor intensidad que el home para no competir con el contenido
- Tipografía: Enriq Round Sans Serif
- Objetivo: explicar quiénes somos de forma clara, corta y con personalidad

---

## 1. HEADER
- Igual al resto del sitio (fixed, negro con blur)

---

## 2. BLOQUE PRINCIPAL

### Layout Desktop
- 2 columnas
  - Izquierda: imagen
  - Derecha: contenido (título + texto)

### Layout Mobile
- 1 columna
- orden:
  1. título
  2. imagen
  3. texto

---

## 3. IMAGEN

- Fuente: CMS (editable)
- Contenido: foto real de los socios
- Objetivo: humanizar la marca y reforzar identidad

### Formato
- ratio libre (horizontal o vertical)
- evitar recortes agresivos

### Comportamiento
- mantener proporción original
- no deformar
- object-fit: cover solo si es necesario

### Recomendación
- evitar imágenes genéricas o abstractas
- priorizar foto con personalidad (no corporativa fría)

---

## 4. TÍTULO

- Texto: SOMOS DRAMA
- Color: negro (#000)
- Tamaño:
  - desktop: 72–96px
  - mobile: 40–56px
- Weight: bold
- Uppercase

### SEO (estructura)
- incluir un H1 real en HTML
- puede convivir con el título visual
- opción recomendada:
  "Somos DRAMA, una agencia de diseño y comunicación para entretenimiento en Buenos Aires"

---

## 5. CONTENIDO (CAJA NEGRA)

### Contenedor
- fondo: #000000
- padding: amplio (32–48px desktop / 24px mobile)
- color texto: #FFFFFF

---

### Estructura de texto (Opción B)

Dividido en 3 bloques:

#### 1. QUIÉNES SOMOS
- párrafo corto
- tono directo

#### 2. CÓMO TRABAJAMOS
- párrafo corto
- enfocado en proceso / enfoque

#### 3. QUÉ NOS DIFERENCIA
- párrafo corto
- foco en valor único

---

### Reglas
- evitar texto largo
- máximo 2–3 líneas por bloque
- aire entre bloques

---

## SEO

- esta página debe ser indexable y aportar contexto de marca

### Metadata
- definir:
  - title
  - meta description

### Contenido
- el texto visible ya cumple función SEO
- no es necesario ocultar contenido como en el home

### Implementación
- usar estructura semántica correcta (h1, h2, p)
- evitar texto dentro de imágenes

---

## 6. TICKER

- mismo que HOME
- texto en loop:
  "DISEÑO Y COMUNICACIÓN PARA ENTRETENIMIENTO"

- reutilizar mismo componente del home (no duplicar lógica)

---

## 7. ÍCONOS DE CONTACTO

### Ubicación
- debajo del ticker

### Contenido
- Instagram
- WhatsApp
- Mail

### Links
- usar links definidos en `drama_master.md`

### Implementación
- los íconos deben ser links reales (`<a>`)
- incluir labels accesibles (aria-label)
- evitar botones sin contexto

### Estilo
- íconos blancos
- centrados
- sin texto
- tamaño:
  - desktop: 48–64px
  - mobile: 36–52px

### Interacción
- hover:
  - scale leve
  - cambio de opacidad
- transición: 0.2s

---

## 8. FOOTER
- puede omitirse o ser mínimo

---

## DECISIONES CLAVE
- contenido corto
- estructura editorial clara
- imagen editable vía CMS
- foco en identidad, no en cantidad de info
