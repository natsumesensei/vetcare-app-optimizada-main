# VetSys Pro — Clínica Veterinaria

Esta versión amplía la app hacia un PIMS veterinario: pacientes, historia clínica, agenda, vacunación, antiparasitarios, laboratorio/valores de referencia, recetas, farmacia/stock, cirugía, hospitalización, dashboard y documentos imprimibles.

## PDF e impresión
En la ficha del paciente, **Imprimir / PDF** abre una historia clínica A4. En el diálogo de impresión del navegador selecciona **Guardar como PDF** o una impresora física.

## Valores de referencia
Incluye rangos orientativos de perros y gatos basados en Merck Veterinary Manual. No deben sustituir el rango del laboratorio que realizó el análisis; los intervalos pueden variar según método y laboratorio.

## Instalación
```bash
cd backend
npm install
npm start
```
En otra terminal:
```bash
cd frontend
npm install
npm run dev
```

Usuario inicial: `admin@clinica.com` / `admin123` (si ya existe en la base de datos original).
