# DRAMA - MAPA DE CONTENIDO PARA IDIOMAS

## Objetivo

Separar el texto fijo del sitio del contenido editable antes de sumar ingles y portugues.

## Sitio fijo

Este contenido vive en codigo y lo puede cambiar Codex directamente:

- Navegacion publica: HOME, PROYECTOS, NOSOTROS, SUMATE.
- Labels, botones, aria-labels y estados de la interfaz publica.
- Metadata fija del sitio y de paginas estaticas.
- Titulos fijos como PROYECTOS, FUN MODE y textos de contacto.
- Textos estructurales de formularios, mensajes de exito y errores.

Primer punto de entrada:

- `lib/site-copy.ts`

## Contenido editable

Este contenido no conviene hardcodearlo porque se cambia desde el admin o desde archivos data:

- `data/site.json`
  - Home: hero, servicios, logos, ticker.
  - Nosotros: textos, imagen, FAQs.
  - Settings: Instagram, WhatsApp, mail.
- `data/projects.json`
  - Proyectos, tags, excerpts, SEO, bloques de contenido e imagenes.
- `data/trivia.json`
  - Preguntas, respuestas y feedback de trivia.

## Regla practica

Si el usuario lo edita desde el admin, es contenido traducible guardado. Si solo aparece porque la interfaz lo necesita, es copy fijo del sitio.

## Siguiente paso recomendado

1. Completar `lib/site-copy.ts` con todo el copy fijo publico.
2. Crear traducciones `es`, `en`, `pt` para ese copy.
3. Agregar traducciones guardadas para `data/site.json`, `data/projects.json` y `data/trivia.json`.
4. Recien despues conectar un script automatico con Google Cloud Translation para generar borradores.
