# DRAMA — MENÚ FULLSCREEN (v1.0)

## GLOBAL

- Tipo de componente: menú fullscreen overlay
- Se usa tanto en desktop como en mobile
- NO es dropdown
- NO es drawer lateral
- Tapa por completo la interfaz existente
- Al abrirse:
  - bloquea el scroll del body
  - queda por encima de todo el sitio
- Tipografía: "Enriq Round Sans Serif"
- Estética:
  - fondo negro
  - franja degradé superior
  - franja degradé inferior
  - navegación central protagónica

---

## 1. CAPA GENERAL DEL MENÚ

### Comportamiento
- position: fixed
- inset: 0
- width: 100vw
- height: 100dvh
- z-index: muy alto (por encima del header y del modal de proyectos si coexistieran)
- overflow: hidden

### Fondo
- color base: #000000

### Scroll
- mientras el menú está abierto:
  - `document.body` sin scroll
  - no se puede scrollear el contenido detrás

---

## 2. FRANJAS DEGRADÉ

### Franja superior
- ubicada pegada arriba del viewport
- width: 100%
- altura aproximada:
  - desktop: 120–160px
  - mobile: 90–120px
- fondo:
  - usar versión simplificada del gradiente definido en `drama_master.md`
  - no redefinir colores en este archivo
  - mantener menor intensidad que el home para no competir con la navegación

### Franja inferior
- ubicada pegada abajo del viewport
- width: 100%
- altura aproximada:
  - desktop: 60–100px
  - mobile: 50–80px
- usar la misma lógica que la franja superior
- basado en el gradiente definido en `drama_master.md`

### Importante
- ambas franjas son decorativas
- el área central del menú sigue siendo negra
- no deben competir con los links

---

## 3. HEADER INTERNO DEL MENÚ

### Layout
- ubicado dentro del overlay
- posición visual: arriba
- distribución:
  - logo izquierda
  - botón cerrar derecha

### Espaciado
- padding horizontal:
  - desktop: 32px
  - mobile: 20px
- padding top:
  - desktop: 24px
  - mobile: 20px

---

### 3.1 Logo

- usar como archivo real en esta instancia: `public/logos/logo-byn-invertido.png`
- este es el logo principal invertido definido para el sitio
- ubicado arriba a la izquierda
- tamaño aproximado:
  - desktop: 110–150px de ancho
  - mobile: 90–120px de ancho
- formato actual: PNG
- funciona correctamente sobre el banner degradé

---

### 3.2 Botón cerrar

- ubicado arriba a la derecha
- ícono: X
- tamaño visible:
  - desktop: 40–52px aprox
  - mobile: 32–44px aprox
- color: negro o muy oscuro, según contraste con el degradé

#### Interacción hover / active
- debe tener efecto visible
- recomendado:
  - leve rotación
  - leve scale
  - leve cambio de opacidad
- transición:
  - 0.2s a 0.25s ease

#### Acción
- cierra el menú fullscreen
- no navega
- no altera la URL

---

## 4. NAVEGACIÓN PRINCIPAL

### Layout general
- bloque central dominante
- centrado horizontalmente
- visualmente ubicado en la zona media de la pantalla
- los items se apilan en columna
- cada item ocupa gran ancho visual
- la navegación debe sentirse protagonista y muy editorial

### Items
En este orden exacto:
1. HOME
2. PROYECTOS
3. SOBRE NOSOTROS
4. CONTACTO

### Alineación
- centrados horizontalmente
- cada item dentro de una fila de ancho amplio

### Tipografía
- uppercase
- weight: bold / extra bold
- estilo itálico según maqueta
- color: #FFFFFF
- tamaño:
  - desktop: extremadamente grande, aprox 72–120px según ancho disponible
  - mobile: grande, aprox 40–72px
- line-height: ajustado
- tracking: normal o apenas condensado

---

## 5. DIVISORES ENTRE ITEMS

### Reglas
- hay líneas divisorias horizontales ENTRE items
- NO hay línea arriba del primero
- NO hay línea abajo del último

### Estilo
- color: blanco
- grosor: 1–2px
- ancho: amplio, sin tocar por completo los bordes del viewport
- alineados visualmente con la caja de navegación

### Secuencia visual correcta
- HOME
- línea
- PROYECTOS
- línea
- SOBRE NOSOTROS
- línea
- CONTACTO

---

## 6. ACCIÓN DE CADA ITEM

### Comportamiento
- al tocar o clickear una opción:
  - se navega a la página o vista correspondiente
  - NO hace scroll interno a secciones
  - NO hace smooth scroll en la misma página

### Destinos conceptuales
- HOME:
  - lleva al home
- PROYECTOS:
  - lleva a la vista de Proyectos Destacados
- SOBRE NOSOTROS:
  - lleva a la página/vista Sobre Nosotros
- CONTACTO:
  - lleva a `/contacto`

### Cierre
- el menú se cierra al navegar

### Implementación semántica
- la navegación debe implementarse con elementos semánticos
- usar `<nav>` para el contenedor principal de links
- usar `<a>` o `Link` reales para cada item
- evitar divs clickeables sin href

---

## 7. HOVER DE ITEMS (DESKTOP)

### Requerimiento
- cada item debe tener interacción visible en hover

### Recomendación visual
- leve glow o aumento de brillo
- leve desplazamiento horizontal o scale mínimo
- mantener elegancia, sin efecto exagerado

### Parámetros sugeridos
- transform:
  - scale(1.01) o translateX(4px)
- text-shadow o brightness leve
- transition:
  - 0.2s a 0.25s ease

### Importante
- el hover debe reforzar que el item es clickeable
- no debe deformar la composición general

---

## 8. BLOQUE DE ÍCONOS SOCIALES

### Ubicación
- zona inferior del menú
- centrado horizontalmente
- por encima de la franja degradé inferior

### Contenido
Solo íconos, sin texto:
1. Instagram
2. WhatsApp
3. Mail

### Links
- usar links definidos en `drama_master.md`

### Layout
- display: flex
- justify-content: center
- align-items: center
- gap:
  - desktop: 48–72px
  - mobile: 32–48px

### Tamaño
- íconos grandes, claros, blancos
- aprox:
  - desktop: 48–64px
  - mobile: 36–52px

### Interacción
- hover:
  - leve scale
  - opacidad/brillo
- transition: 0.2s ease

---

## 9. RESPONSIVE

### Lógica general
- desktop y mobile comparten exactamente el mismo concepto:
  - fullscreen overlay
  - header interno
  - links gigantes al centro
  - íconos abajo
- NO existe una versión “desktop compacta”

### Ajustes responsive
- en mobile:
  - reducir escalas
  - mantener aire suficiente entre items
  - asegurar que todo entre sin sensación apelmazada
- en desktop:
  - aprovechar el ancho para que la navegación se vea monumental

---

## 10. JERARQUÍA VISUAL

### Orden de lectura esperado
1. logo + X
2. navegación principal
3. íconos sociales

### Importante
- la navegación central es el foco principal
- los íconos sociales son secundarios
- las franjas degradé enmarcan, pero no deben robar protagonismo

---

## 11. MICROINTERACCIONES

### Apertura del menú
- puede entrar con fade + leve slide o fade + scale
- transición suave
- duración sugerida:
  - 250–400ms

### Cierre del menú
- animación inversa
- rápida pero elegante

### Recomendación
- evitar animaciones complejas o exageradas
- el look debe sentirse premium y seguro

---

## 12. DECISIONES CERRADAS

- menú fullscreen en desktop y mobile
- fondo negro
- banner degradé superior e inferior
- logo principal invertido arriba izquierda (`public/logos/logo-byn-invertido.png`)
- botón X arriba derecha con hover
- links gigantes centrados
- líneas solo entre items
- navegación entre páginas reales, no scroll a anclas
- íconos inferiores: Instagram + WhatsApp + Mail
- íconos sin texto
- body scroll bloqueado al abrir
