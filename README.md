# VetCare - Sistema de Gestión Clínica Veterinaria Integral

Sistema web completo para clínicas y hospitales veterinarios. Desarrollado con Node.js, Express, React, Tailwind CSS y SQLite/PostgreSQL.

---

## 🚀 Requisitos Previos
- **Node.js**: Versión 18 o superior (recomendado Node 20 LTS)
- **npm** o **yarn**

---

## 🛠️ Instalación y Ejecución Local

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/TU_USUARIO/vetcare.git
   cd vetcare
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Iniciar en modo desarrollo:**
   ```bash
   npm run dev
   ```
   Abre tu navegador en `http://localhost:3000`.

4. **Credenciales por defecto:**
   - **Usuario:** `admin@clinica.com`
   - **Contraseña:** `admin123`
   *(Puedes cambiar tu usuario, contraseña y moneda desde el menú Configuración > Mi Perfil).*

---

## 🌐 Despliegue Gratuito en Render.com

1. Sube tu proyecto a un repositorio en **GitHub**.
2. Entra en [Render.com](https://render.com) e inicia sesión con tu cuenta de GitHub.
3. Haz clic en **New +** y selecciona **Web Service**.
4. Conecta tu repositorio de VetCare.
5. Configura los siguientes campos:
   - **Name:** `vetcare-clinica` (o el nombre que prefieras)
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free`
6. En la sección **Environment Variables**, añade:
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: `tu_clave_secreta_aqui_123`
7. Haz clic en **Create Web Service**. ¡En 2 minutos tendrás tu enlace público accesible desde cualquier dispositivo!
