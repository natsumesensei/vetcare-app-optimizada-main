# 🚀 Guía de Despliegue y Puesta en Producción: VetCare Clinical Management

Esta guía documenta los pasos para desplegar **VetCare** en un entorno de producción (ej. **GitHub + Render**) con base de datos PostgreSQL o SQLite, y cómo ejecutarlo localmente.

---

## 1. Requisitos Previos
- Node.js versión 18 o superior.
- Git instalado.
- Cuenta gratuita en [Render.com](https://render.com) o proveedor similar (Neon, Supabase, Cloudflare Pages, Vercel).
- Clave de API de [Google AI Studio](https://aistudio.google.com) (para el asistente Gemini AI).

---

## 2. Ejecución Local (Desarrollo)

```bash
# 1. Clonar el repositorio
git clone <URL_DEL_REPOSITORIO>
cd vetcare

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Edita .env y añade tus claves (JWT_SECRET, GEMINI_API_KEY)

# 4. Iniciar en modo desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`.

---

## 3. Credenciales de Acceso Inicial (Admin)

El sistema genera automáticamente el usuario administrador al inicializar la base de datos:

- **Email:** `admin@vetcare.com`
- **Contraseña:** `admin123`
- **Rol:** `Administrador`

> ⚠️ **Importante en Producción:** Tras iniciar sesión por primera vez, ingresa a **Configuración > Usuarios y Seguridad** para cambiar la contraseña predeterminada o crear nuevos usuarios veterinarios y recepcionistas.

---

## 4. Despliegue en Render (Web Service Completo)

Render permite desplegar tanto el backend como el frontend compilado en un único servicio web en su nivel gratuito.

### Paso A: Crear el Web Service en Render
1. Conecta tu repositorio de GitHub en Render.
2. Selecciona **New Web Service**.
3. Configuración del servicio:
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start` (o `node server.js`)
   - **Plan:** Free

### Paso B: Configurar Variables de Entorno en Render
En la pestaña **Environment** de tu servicio en Render, agrega:

| Variable | Valor Recomendado |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `JWT_SECRET` | *(Cadena aleatoria segura para firmar JWT)* |
| `GEMINI_API_KEY` | *(Tu API Key de Google AI Studio)* |

---

## 5. Configuración con PostgreSQL en Producción (Opcional)

Si deseas utilizar PostgreSQL en lugar de SQLite para alta disponibilidad:
1. Crea una base de datos PostgreSQL gratuita en Render o [Neon.tech](https://neon.tech).
2. Ejecuta el script de esquema incluido en el proyecto:
   ```bash
   psql $DATABASE_URL -f backend/database/pg_schema.sql
   ```
3. Añade la variable `DATABASE_URL` a tu servicio web.

---

## 6. Verificación de Salud de la API

Puedes verificar el estado del servidor con el endpoint de salud:
```bash
curl https://tu-app.onrender.com/api/health
# Respuesta: {"success":true,"application":"VetCare API","version":"1.0.0","status":"online"}
```
