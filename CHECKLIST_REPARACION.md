# Checklist de reparación Vet Nestor

- Se eliminó `React.StrictMode` del punto de entrada para evitar dobles ciclos de efectos durante desarrollo mientras se estabiliza la aplicación.
- El dashboard usa un `useEffect` correcto: la función efecto no devuelve una Promise.
- El dashboard normaliza arrays de API (`todayAppointmentsList`, `hospitalizationsList`, `monthlyStats`) y nunca debería romper por datos faltantes.
- Si `/api/dashboard` falla, se muestra el dashboard vacío y un aviso en lugar de dejar la vista en blanco.
- Vite ya no usa `__dirname` en la configuración; usa `import.meta.dirname`.
- El API sigue usando `/api` y el proxy de Vite apunta a `http://localhost:3000`.
- Se integró el logo de Vet Nestor en login y sidebar.
- Se configuró la identidad visual básica como Vet Nestor / San Pedro de Macorís, RD / 849-806-6352.
- Se agregó `INICIAR-VETNESTOR.bat` para iniciar backend, frontend y abrir el navegador.

## Credenciales iniciales

`admin@clinica.com` / `admin123`
