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

## 8. Lo que la app NO hace

- No escribe las columnas J (Check), K (Monto) ni L (Año-Mes) — el Sheets las calcula solo con sus fórmulas
- No edita las tablas de Resumen, Servicios Compartidos ni Proyección Futura (solo las lee para el dashboard)
- No toca ninguna otra hoja del Sheets ni ninguna otra parte del admin de Drama
