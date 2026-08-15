# HC_comp - Sistema de Gestión de Inventario y Stock

Sistema de gestión de inventario para piezas confeccionadas (*Peças Prontas*) y estampas sueltas (*Estampas Avulsas*), con verificación instantánea de disponibilidad por SKU, soporte multimarca y registro de auditoría de movimientos.

---

## 🛠️ Stack Tecnológico Modernizado

- **Backend**:
  - **Python 3.11+ / 3.14+**
  - **uv** como gestor ultra-rápido de entorno virtual y dependencias (`.venv`, `pyproject.toml`, `uv.lock`)
  - **Flask 3.0+** & **Flask-CORS**
  - **SQLAlchemy 2.0+**
  - **Pytest** (suite con 64 tests unitarios, de integración y de concurrencia)

- **Frontend**:
  - **Bun** como gestor de paquetes y runtime de alto rendimiento (`bun.lock`)
  - **React 18** + **Vite**
  - **Tailwind CSS** (tema oscuro/claro, microanimaciones y glassmorphism)
  - **Recharts** (gráficos y métricas en Dashboard)
  - **Sonner** & **Lucide React**
  - **Vitest** + **React Testing Library** (16 tests de interfaz y utilidades)

---

## 🚀 Guía de Ejecución y Desarrollo

### 1. Backend (con `uv`)

```bash
# Entrar al directorio backend
cd backend

# Crear entorno virtual e instalar dependencias con uv
uv venv .venv
uv pip install -r requirements.txt

# Ejecutar la suite completa de pruebas (64 tests)
uv run pytest -v

# Iniciar el servidor backend Flask (puerto 5000)
uv run python app.py
```

### 2. Frontend (con `bun`)

```bash
# Entrar al directorio frontend
cd frontend

# Instalar dependencias con Bun
bun install

# Ejecutar las pruebas del frontend (Vitest con Bun)
bun run test

# Iniciar el servidor de desarrollo de Vite (puerto 5173 con proxy a /api)
bun run dev

# Generar bundle de producción
bun run build
```

---

## 🧪 Resumen de Pruebas

| Módulo | Comando | Estado | Tests |
|---|---|---|---|
| **Backend** | `cd backend && uv run pytest -v` | ✅ PASS | 64 tests pasados (CRUD, UPSERT, Verificador SKU, Locks de Concurrencia, Modelos) |
| **Frontend** | `cd frontend && bun run test` | ✅ PASS | 16 tests pasados (Componentes, Tablas, Modales, Búsqueda SKU, Utilidades) |
| **Frontend Build** | `cd frontend && bun run build` | ✅ PASS | Bundle optimizado generado con éxito |
