# Fila

Aplicación web en español para organizar la atención de clientes mediante turnos.

## Funciones

- Crear turnos con nombre, servicio y teléfono opcional.
- Ver la fila, llamar al siguiente cliente y cerrar una atención.
- Buscar clientes y consultar el estado de cada turno.
- Ver un resumen de actividad y servicios del día.
- Guardar los turnos en el navegador y reiniciar la jornada al día siguiente.

## Ejecutar localmente

Es un sitio estático sin dependencias de instalación. Abre `index.html` o inicia un servidor local, por ejemplo:

```bash
npx serve .
```

## Publicar en Vercel

Importa el repositorio en Vercel. No se requiere comando de compilación; usa la raíz del repositorio como directorio de salida.

## Almacenamiento

Los datos se conservan en el navegador mediante `localStorage`. Esta versión funciona como demostración en un dispositivo o navegador; para compartir la fila entre clientes y empleados en diferentes dispositivos, conecta una base de datos y autenticación.
