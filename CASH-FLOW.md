# Cash Flow — Documentación y plan de implementación

---

## 1. Qué es el Google Sheets

El Sheets (`1Zov6WO-moJkFEEa_VA6xdXRO-OwM-3946Rjs1VPAx80`) es el sistema de gestión financiera de Drama. Tiene varias tablas apiladas en una misma hoja (gid=1444098922). La tabla principal y la única que vamos a editar desde la app es el **Cash Flow** (también llamada "Movimientos"). Las demás tablas son calculadas automáticamente por fórmulas del Sheets.

---

## 2. Tabla Cash Flow — columna por columna

La tabla tiene headers en la **fila 2**. Los datos empiezan en la **fila 3**.

| Col | Nombre | ¿Editable? | Descripción |
|-----|--------|------------|-------------|
| A | Fecha | ✅ | Fecha del movimiento (sin hora) |
| B | Detalle | ✅ | Nombre del cliente (ej: "Luis Penna") o nombre de un ítem (ej: "Pase", "Regalo", "Google Suite") |
| C | Detalle II | ✅ | La obra o proyecto puntual de ese cliente (ej: "La cena de los tontos"). Un cliente puede tener múltiples obras. |
| D | A cuenta | ✅ | Plata que se le cobró/avisó al cliente pero **todavía no llegó a ninguna caja**. Es temporal. Solo se usa en ingresos de cliente. |
| E | Caja Guido | ✅ | Plata que entró o salió del bolsillo/cuenta de Guido. |
| F | Caja Mati | ✅ | Plata que entró o salió del bolsillo/cuenta de Mati. |
| G | Facturado | ✅ | Si y cómo se le cobró al cliente (ver sección 3). |
| H | Tipo | ✅ | `Ingreso` / `Egreso` / `Pase` |
| I | Categoría | ✅ | `Cliente` / `Servicios` / `Sueldos` / `Marketing` / `Proveedores` / `Pase` |
| J | Check | 🔒 fórmula | `=SI(Y(G<>"";D<>"");1;"")` — Devuelve `1` si la fila tiene Facturado completo Y todavía tiene plata en A cuenta. Sirve para pintar la fila de amarillo: recordatorio de que el cliente fue facturado/avisado pero aún no pagó. |
| K | Monto | 🔒 fórmula | Suma de Caja Guido + Caja Mati. Representa el total del movimiento. |
| L | Año-Mes | 🔒 fórmula | Derivado de Fecha (ej: "2026-5"). Se usa para agrupar en el dashboard. |

---

## 3. La columna Facturado — el concepto más importante

**Facturado no es lo mismo que Caja. Son dos cosas completamente independientes.**

- **Facturado** = si y cómo se le comunicó el cobro al cliente → alimenta el **Dashboard de facturación** (Facturó Mati / Facturó Guido).
- **Caja** = flujo real de plata entre los socios → alimenta el **balance Guido/Mati** (quién le debe a quién, los Pases).

| Valor | Significado | Fila amarilla | Dashboard |
|-------|-------------|---------------|-----------|
| *(vacío)* | No se le notificó al cliente todavía | No | No aparece |
| `Nadie` | Se le avisó al cliente pero sin emitir factura formal | Sí | No aparece ni en Guido ni en Mati |
| `Guido` | Guido emitió factura oficial | Sí | Suma en "Facturó Guido" |
| `Mati` | Mati emitió factura oficial | Sí | Suma en "Facturó Mati" |

---

## 4. Los tres tipos de fila

### Ingreso + Cliente
El cliente paga por un trabajo. Puede estar en dos estados:

```
Sin notificar:      A cuenta=[vacío o monto esperado],  Caja=[vacío],  Facturado=[vacío]
Facturado/avisado:  A cuenta=[monto],                   Caja=[vacío],  Facturado=[Nadie/Guido/Mati]  → AMARILLO
Cobrado:            A cuenta=[vacío],                   Caja=[monto],  Facturado=[Nadie/Guido/Mati]
```

**El flujo es:** se carga el trabajo con A cuenta → cuando se le avisa/factura al cliente, se llena Facturado (y la fila se pinta amarilla) → cuando el cliente paga, se borra A cuenta y el valor pasa a Caja Guido o Caja Mati en la misma fila.

### Egreso + (Servicios / Sueldos / Marketing / Proveedores)
Gastos del negocio. Siempre van directamente a las cajas (nunca a A cuenta). Los valores en Caja son negativos.

Ejemplos:
- Google Suite → `-$33.840` en Caja Guido y `-$33.840` en Caja Mati (gasto compartido)
- Sueldo Martu → valor solo en Caja Mati o Caja Guido (según quién pagó)

### Pase + Pase
Devolución de plata entre socios. Una caja va en negativo y la otra en positivo por el mismo monto. El Monto neto es $0. Se usa para registrar que Guido le devolvió plata a Mati o viceversa.

Ejemplo:
```
Caja Guido: -$671.388 / Caja Mati: +$671.388  → Guido le devolvió $671.388 a Mati
```

El dashboard de la segunda hoja tiene una fórmula que calcula si están "a mano" o quién le debe cuánto al otro.

---

## 5. Las otras tablas del Sheets (solo lectura desde la app)

Debajo de la tabla de Cash Flow hay tablas calculadas que la app lee para mostrar el dashboard, pero **no escribe**:

| Tabla | Columnas | Para qué sirve |
|-------|----------|----------------|
| Resumen Mensual | AñoMes, Mes, Facturación, Gasto, Margen, Ganancia, Facturó Mati, Facturó Guido | Dashboard de facturación mensual |
| Ingresos por Cliente | Cliente, Trabajo, Mes, Año, Valor, Estado, Facturado por | Vista por cliente |
| Servicios Compartidos | Servicio, Quién pagó, Quién devolvió, Mes, Año, Valor, Estado | Tracking de gastos compartidos |
| Proyección Futura | Clientes × meses futuros | Ingresos esperados próximos meses |

---

## 6. Lo que voy a hacer

### Stack y enfoque
- La sección se llama **Cash Flow** y va dentro del admin de drama-web, igual que el Presupuestador
- Ruta: `/admin/cash-flow`
- Conexión en tiempo real con Google Sheets via Google Sheets API (Service Account)
- Reutiliza `getGoogleAccessToken()` de `lib/google-auth.ts` que ya existe
- Mismos patrones de estilo y auth que el resto del admin (dark theme, JWT, clases `admin-input`)

### Archivos nuevos

```
lib/cash-flow-sheets.ts                          ← toda la lógica de la Sheets API
lib/cash-flow-types.ts                           ← tipos TypeScript

app/api/admin/cash-flow/movimientos/route.ts     ← GET (lista) y POST (nuevo)
app/api/admin/cash-flow/movimientos/[row]/route.ts ← PUT (editar) y DELETE
app/api/admin/cash-flow/resumen/route.ts         ← GET para el dashboard

app/admin/cash-flow/page.tsx                     ← página principal

components/admin/cash-flow/CashFlowTable.tsx     ← tabla de movimientos
components/admin/cash-flow/MovimientoForm.tsx    ← modal crear/editar
components/admin/cash-flow/CashFlowDashboard.tsx ← gráficos y balance
```

### Un solo archivo a modificar

```
components/admin/AdminSidebar.tsx  ← agregar "Cash Flow" en toolItems (igual que Presupuestador)
```

### Nueva variable de entorno a configurar

```
FINANZAS_SPREADSHEET_ID=1Zov6WO-moJkFEEa_VA6xdXRO-OwM-3946Rjs1VPAx80
```

Hay que agregarla en `.env.local` y en Vercel. La auth de Google (Service Account) ya está configurada.

### También hay que instalar

```bash
npm install recharts
```

Para los gráficos del dashboard (no hay librería de charts en el proyecto actualmente).

---

## 7. Qué va a poder hacer la app

### Tabla de movimientos
- Ver todos los movimientos del Cash Flow
- Filtrar por: Tipo, Categoría, Año-Mes, Estado (pendiente / cobrado / todo)
- Filas amarillas cuando el cliente fue facturado pero todavía no pagó (Check=1)
- Editar cualquier fila (abre modal)
- Borrar una fila
- Crear un movimiento nuevo
- Acción rápida "Marcar cobrado" en filas amarillas: limpia A cuenta y mueve el valor a la caja correspondiente

### Modal de creación/edición
El form se adapta según el Tipo:
- **Ingreso (Cliente):** muestra A cuenta + Facturado + Cajas opcionales
- **Egreso:** solo Cajas (en negativo), sin A cuenta
- **Pase:** solo Cajas, una positiva y otra negativa

### Dashboard
- Gráfico de barras: Facturación vs Gasto por mes
- Cards: Facturó Mati / Facturó Guido (acumulado)
- Balance: "Mati le debe $X a Guido" o "Están a mano" (igual que la fórmula del Sheets)

---

## 8. Carga de facturación de un nuevo mes

Cuando haya que preparar la facturación de un mes nuevo, el flujo no es copiar filas a ciegas. Hay que detectar recurrencias, separar casos dudosos y pedir confirmación antes de escribir en el Sheets.

### 8.1. Meses de referencia

Para cargar el mes actual, se revisan principalmente los **dos meses anteriores cerrados**.

Ejemplo: para cargar junio 2026, se revisan abril 2026 y mayo 2026.

### 8.2. Qué cuenta como recurrente

Un cliente/trabajo es candidato recurrente si:

- aparece como `Ingreso` + `Cliente`
- tiene el mismo cliente y el mismo trabajo, o nombres claramente equivalentes
- aparece en los dos meses anteriores
- los montos tienen una relación razonable entre sí

No alcanza con repetir cliente/trabajo. El monto tambien tiene que estar en la misma escala.

Ejemplo valido:

```
Ozono / Charlie y la fabrica de chocolate
Abril: $2.053.865
Mayo:  $2.183.160
```

Es una variacion razonable, entonces se toma el monto mas nuevo como referencia.

Ejemplo que NO debe tomarse como base:

```
Ozono / Charlie y la fabrica de chocolate
Mayo: $2.183.160
Mayo: $400.000
```

El segundo monto esta demasiado alejado. Probablemente sea un parcial, extra, saldo o ajuste puntual.

### 8.3. Monto propuesto

Si hay dos meses consecutivos con montos comparables, se propone cargar el monto del ultimo mes.

Ejemplo:

```
Abril: $1.250.870
Mayo:  $1.329.615
Propuesta para junio: $1.329.615
```

### 8.4. Dos meses iguales

Si el monto se repitio igual durante dos meses seguidos, no se carga automaticamente con ese mismo precio. Puede corresponder aumento.

En ese caso se carga el cliente/trabajo **sin precio**, o se deja en la lista de revision, segun lo que se acuerde.

Ejemplo:

```
Bautista Laviaguerre / Alejandra
Abril: $617.490
Mayo:  $617.490
```

Para junio se puede crear la fila sin monto, esperando el precio actualizado.

### 8.5. Si ya existe en el mes actual

Antes de cargar una recurrencia hay que revisar si el cliente/trabajo ya existe en el mes actual.

- Si ya existe con monto comparable, no se duplica.
- Si ya existe con un monto muy distinto, se informa como caso a revisar.
- Si ya existe sin monto, puede ser un placeholder para completar.

### 8.6. Como se carga por defecto

Cuando el usuario confirma la carga, las filas nuevas van asi:

| Columna | Valor |
|---------|-------|
| Fecha | Fecha del dia de carga |
| Detalle | Cliente |
| Detalle II | Trabajo |
| A cuenta | Monto propuesto |
| Caja Guido | Vacio |
| Caja Mati | Vacio |
| Facturado | Vacio |
| Categoria | Cliente |

Las columnas `Tipo`, `Check`, `Monto` y `Año-Mes` quedan a cargo de las formulas del Sheets.

Si se carga una fila sin precio, `Tipo` puede mostrarse como `Pase` porque la formula clasifica por la suma de montos. Eso es esperable hasta que se complete `A cuenta`.

### 8.7. Reporte previo obligatorio

Antes de escribir, hay que mostrar una tabla de revision con:

- cliente/trabajo
- filas usadas como evidencia
- montos anteriores
- monto propuesto
- decision sugerida

Las decisiones posibles son:

| Decision | Significado |
|----------|-------------|
| Cargar | Recurrente con monto comparable |
| Cargar sin precio | Recurrente, pero requiere aumento o precio nuevo |
| Revisar | Hay montos raros, parciales, duplicados o conflicto |
| Solo aparecio el mes pasado | Posible nuevo recurrente, pero sin historial suficiente |

### 8.8. Clientes que aparecieron solo el mes pasado

Despues de detectar recurrentes, tambien hay que revisar los `Ingreso` + `Cliente` del ultimo mes cerrado que no aparecieron en el mes anterior.

No se cargan automaticamente, pero se informan porque pueden ser nuevos clientes mensuales que todavia no tienen dos meses de historial.

Ejemplo de salida esperada:

```
Solo aparecieron en mayo:
- Cliente / Trabajo / Monto / Fila
```

El usuario decide si alguno se suma al mes nuevo.

### 8.9. Regla de seguridad

Si hay duda, no se escribe. Se informa el caso y se espera confirmacion.

---

## 9. Lo que la app NO hace

- No escribe las columnas J (Check), K (Monto) ni L (Año-Mes) — el Sheets las calcula solo con sus fórmulas
- No edita las tablas de Resumen, Servicios Compartidos ni Proyección Futura (solo las lee para el dashboard)
- No toca ninguna otra hoja del Sheets ni ninguna otra parte del admin de Drama
