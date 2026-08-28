# Vet Nestor / VetCare — instalación y arranque

## 1. Backend

Abre PowerShell en `backend`:

```powershell
npm install
node server.js
```

Debe aparecer `Servidor ejecutándose en http://localhost:3000`. No cierres esa ventana.

## 2. Frontend

Abre otra PowerShell en `frontend`:

```powershell
npm install
npm run dev
```

Abre `http://localhost:5173`.

## 3. Acceso demo

- Correo: `admin@clinica.com`
- Contraseña: `admin123`

## 4. Si aparece una pantalla blanca

1. Comprueba que el backend esté en el puerto 3000.
2. En el navegador pulsa `Ctrl + F5`.
3. Si ya existía una sesión antigua, abre DevTools → Application → Local Storage y elimina `token` y `user`; después vuelve a entrar.
4. El proyecto ya evita `useEffect(async () => ...)` y normaliza la respuesta del dashboard para que una API caída no deje la pantalla en blanco.

## 5. Logo

El logo entregado para Vet Nestor está integrado en login y menú lateral.
