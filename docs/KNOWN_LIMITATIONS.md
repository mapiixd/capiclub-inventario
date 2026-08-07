# Limitaciones Conocidas y Mejoras Futuras

## Limitaciones MVP

- SQLite esta pensado para baja concurrencia.
- No hay facturacion electronica.
- No hay integracion con terminales bancarios.
- No hay sincronizacion entre sucursales.
- La restauracion de respaldo requiere reiniciar la aplicacion.
- El entregable usa scripts `.bat`, no un instalador `.exe` nativo.
- El cambio de contrasena desde UI queda como mejora posterior.

## Mejoras futuras

- Empaquetador `.exe` con runtime incluido.
- Backups programados por tarea de Windows.
- Pruebas end-to-end automatizadas.
- PostgreSQL para mayor concurrencia.
- Reportes avanzados con graficos interactivos.
- Roles y permisos editables desde UI.
