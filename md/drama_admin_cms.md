# DRAMA — ADMIN CMS (v1.0)

## GLOBAL

- Tipo: Backoffice interno
- Acceso: usuario + contraseña
- NO login por mail
- NO PIN
- UI simple, limpia, rápida
- Tipografía: Enriq Round Sans Serif

---

## 1. LOGIN

### Campos
- Usuario
- Contraseña

### Acción
- Botón: INGRESAR

### Comportamiento
- Validación contra backend
- Si OK → Dashboard
- Si error → mensaje simple

---

## 2. DASHBOARD

### Layout
- pantalla limpia con cards grandes

### Secciones
- Proyectos
- Media
- Home
- Sobre Nosotros
- Ajustes

---

## 3. PROYECTOS

### Lista

Cada item muestra:
- Nombre
- Año
- Slug
- Estado (publicado / borrador)
- Destacado (sí/no)

### Acciones
- Editar
- Duplicar
- Borrar
- Publicar / Despublicar

### Arriba
- Buscador
- Botón: NUEVO PROYECTO

---

## 4. EDITAR / CREAR PROYECTO

### A. Datos
- Nombre
- Slug (auto + editable)
- Año
- Destacado (toggle)
- Publicado (toggle)
- SEO Title (editable)
- SEO Description (editable)
- Extracto (texto corto para previews y SEO)

---

### B. Tags
- Lista manual
- Agregar / eliminar

---

### C. Cover
- Imagen portada
- Alt text
- Importante: el alt text debe describir la imagen para SEO

---

### D. Contenido (bloques)

Tipos:
- Todo el contenido debe ser reutilizable tanto en modal como en página individual
- El texto debe ser HTML renderizable (no solo visual)
- image
- imageText
- text

---

#### image
- Imagen
- Alt
- Caption opcional

---

#### imageText
- Imagen
- Texto
- Título opcional
- Lado:
  - auto
  - izquierda
  - derecha

---

#### text
- Título opcional
- Texto

---

### Orden
- Drag & drop
- Subir / bajar
- Duplicar
- Borrar

---

### Acciones
- Guardar borrador
- Publicar
- Vista previa

---

## 5. MEDIA

### Funciones
- Subir archivos
- Ver grilla
- Reutilizar
- Borrar

### Datos por archivo
- Nombre
- Alt text
- Fecha

---

## 6. HOME

### Hero
- Video
- Texto
- Texto rueda

### Servicios
- Listas de items

### Logos ticker
- Agregar / borrar / ordenar

### Contacto
- usar links definidos en `drama_master.md`

### SEO
- definir H1 real
- definir texto descriptivo corto
- estos campos deben poder editarse desde el CMS en el futuro (no obligatorio en esta versión)

---

## 7. SOBRE NOSOTROS

### Campos
- Imagen
- Quiénes somos
- Cómo trabajamos
- Qué nos diferencia

### SEO
- el contenido debe ser indexable
- evitar textos demasiado cortos
- incluir contexto claro de la agencia

---

## 8. AJUSTES

- Links de contacto (usar estructura definida en master)
- Logo principal
- Logo menú
- Favicon

---

## 9. USUARIOS

### Roles
- Admin
- Editor

---

## DATA MODEL

- usar modelo de datos definido en `drama_master.md`
- no duplicar schema en este archivo

---

## DECISIONES

- CMS simple, no genérico
- contenido flexible
- foco en proyectos
- UX rápida
- contenido preparado para SEO desde origen
- estructura compatible con páginas individuales y modal
