# ⚙ Rectificaciones Guzmán — Sistema de Gestión

Sistema de gestión para taller de rectificado de motores.  
La Plata, Buenos Aires, Argentina.

---

## Stack tecnológico

| Capa       | Tecnología              |
|------------|-------------------------|
| Frontend   | React 18 + Vite         |
| Backend    | Node.js + Express (ESM) |
| Base datos | PostgreSQL 15+          |
| Estilos    | CSS-in-JS inline        |

---

## Instalación rápida

### 1. Clonar y configurar

```bash
git clone <repo>
cd rectificaciones-guzman
```

### 2. Base de datos PostgreSQL

```bash
# Crear la base de datos
createdb rectificaciones_guzman

# Ejecutar el schema
psql rectificaciones_guzman < database/schema.sql
```

### 3. Backend

```bash
cd backend
cp .env.example .env
# Editar .env con tus datos de conexión

npm install
npm run dev
# → Servidor en http://localhost:3001
```

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
# → App en http://localhost:5173
```

---

## Variables de entorno

**backend/.env**
```
DATABASE_URL=postgresql://postgres:TU_PASS@localhost:5432/rectificaciones_guzman
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

**frontend/.env** (opcional)
```
VITE_API_URL=http://localhost:3001/v1
```

---

## Estructura del proyecto

```
rectificaciones-guzman/
├── database/
│   └── schema.sql              ← Schema PostgreSQL completo
├── backend/
│   ├── src/
│   │   ├── index.js            ← Entry point Express
│   │   ├── db/pool.js          ← Conexión PostgreSQL
│   │   ├── services/
│   │   │   ├── motores.service.js   ← Lógica de motores + código G26-XXXX
│   │   │   └── ordenes.service.js   ← Lógica de órdenes
│   │   └── routes/
│   │       ├── clientes.js
│   │       ├── all-routes.js   ← Motores, órdenes, caja, dashboard, búsqueda
│   └── package.json
└── frontend/
    ├── src/
    │   ├── App.jsx             ← Router principal
    │   ├── main.jsx            ← Entry point React
    │   ├── lib/api.js          ← Cliente API + helpers
    │   ├── components/
    │   │   ├── ui/index.jsx    ← Componentes base (botones, inputs, modales)
    │   │   └── layout/Layout.jsx ← Sidebar + topbar + búsqueda global
    │   └── pages/
    │       ├── Dashboard.jsx   ← Dashboard + Kanban
    │       ├── Ordenes.jsx     ← Lista, nueva orden, detalle
    │       ├── MotoresClientes.jsx ← Motores y clientes
    │       └── Caja.jsx        ← Caja básica
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## Sistema de código de motor

El código se genera **automáticamente** con el formato:

```
G26-0001
│ │  └──── Secuencial de 4 dígitos (reinicia cada año)
│ └─────── Últimos 2 dígitos del año
└───────── G de Guzmán
```

- La generación es **atómica** (función PostgreSQL + transacción)
- No se puede repetir (constraint UNIQUE)
- El secuencial se **reinicia cada año**
- El historial histórico **nunca se borra**

---

## API Endpoints

### Clientes
```
GET    /v1/clientes           → Lista todos
POST   /v1/clientes           → Crear
GET    /v1/clientes/:id       → Obtener con historial de motores
PUT    /v1/clientes/:id       → Editar
```

### Motores
```
GET    /v1/motores            → Lista (con filtro ?clienteId=)
POST   /v1/motores            → Crear (genera código automático)
GET    /v1/motores/codigo/:code → Buscar por código G26-XXXX
GET    /v1/motores/:id        → Obtener por UUID
```

### Órdenes
```
GET    /v1/ordenes            → Lista (con filtro ?estado=)
POST   /v1/ordenes            → Crear
GET    /v1/ordenes/:id        → Detalle completo
PUT    /v1/ordenes/:id        → Editar
PATCH  /v1/ordenes/:id/estado → Cambiar estado (un click en kanban)
PUT    /v1/ordenes/:id/tecnico → Guardar registro técnico
```

### Caja
```
GET    /v1/caja               → Movimientos + resumen (?desde=&hasta=)
POST   /v1/caja               → Registrar movimiento
```

### Dashboard y búsqueda
```
GET    /v1/dashboard          → Stats + trabajos activos
GET    /v1/busqueda?q=...     → Búsqueda global (motores, clientes, órdenes)
```

---

## Flujo típico de trabajo en el taller

```
1. Cliente trae motor
   → Crear cliente (si es nuevo)
   → Crear motor → sistema genera G26-XXXX
   → Escribir G26-XXXX en el motor con pintura

2. Crear orden de trabajo
   → Ingresar código G26-XXXX
   → Seleccionar tipo de trabajo + sobremedida
   → Poner precio y fecha estimada
   → Estado inicial: INGRESADO

3. Trabajo en curso
   → Tablero kanban: botón "Iniciar" → EN PROCESO
   → Completar registro técnico (diámetros, tolerancias)

4. Motor listo
   → Botón "Terminar" → TERMINADO
   → Llamar al cliente

5. Entrega
   → Botón "Entregar" → ENTREGADO
   → Registrar pago en Caja
```

---

## Producción (deploy básico)

```bash
# Build frontend
cd frontend && npm run build
# Archivos estáticos en dist/ → servir con Nginx o similar

# Backend producción
cd backend
NODE_ENV=production node src/index.js

# Con PM2
pm2 start src/index.js --name guzman-api
```

---

## Próximas features (Fase 2)

- [ ] Presupuestos en PDF
- [ ] WhatsApp: avisos automáticos al cliente
- [ ] Estadísticas anuales por tipo de trabajo
- [ ] Multi-taller (base para SaaS)
- [ ] Control de stock de piezas
- [ ] Backup automático de base de datos

---

**Rectificaciones Guzmán** · La Plata, Buenos Aires  
Sistema desarrollado para uso diario en taller. MVP v1.0
