# Reparación VetCare

## Desarrollo recomendado

Terminal 1 (backend/API):

```powershell
cd backend
node server.js
```

Terminal 2 (frontend):

```powershell
cd frontend
npm install
npm run dev
```

Abrir: http://localhost:5173

El Vite de frontend ahora hace proxy de `/api` y `/uploads` hacia `http://localhost:3000`.

## Alternativa

Desde la raíz, `node server.js` levanta Express y en desarrollo integra Vite como middleware en el mismo servidor.

## Credenciales demo

- correo: `admin@clinica.com`
- contraseña: `admin123`

Si la base de datos ya contiene el administrador, el seed no lo duplica.
