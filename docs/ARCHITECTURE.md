# Arquitectura

## Alternativas evaluadas

### Next.js local con SQLite

Ventajas:

- Una sola aplicacion web usable desde navegador.
- Facil acceso desde otros equipos de la red local.
- Buen soporte de formularios, rutas protegidas, APIs internas y UI.
- SQLite simplifica instalacion inicial.
- Prisma permite una ruta razonable hacia PostgreSQL.

Desventajas:

- Requiere ejecutar un servidor Node.js local.
- Hay que cuidar la concurrencia de escritura en SQLite.
- La instalacion en Windows debe documentarse bien.

### Aplicacion de escritorio con Tauri

Ventajas:

- Experiencia de escritorio empaquetada.
- Buen acceso a archivos locales y respaldo.
- Menor exposicion en red si se usa solo en un computador.

Desventajas:

- Acceso desde otros equipos no queda resuelto naturalmente.
- Agrega complejidad de empaquetado.
- Puede duplicar esfuerzo entre capa local, UI y actualizaciones.

### Aplicacion local con PostgreSQL

Ventajas:

- Mejor concurrencia y robustez para crecimiento.
- Motor de base de datos mas potente para reportes.
- Buena base para multiples tiendas en el futuro.

Desventajas:

- Instalacion y mantencion mas complejas para una tienda pequena.
- Respaldos y restauracion requieren mas cuidado operativo.
- Sobredimensionado para uno a tres usuarios iniciales.

## Alternativa seleccionada

Se selecciona Next.js local con SQLite para el MVP.

La decision prioriza instalacion simple, operacion local, bajo costo de mantencion y acceso desde navegador. La arquitectura separara logica de negocio, validaciones y acceso a datos para que PostgreSQL pueda incorporarse posteriormente sin reescribir la aplicacion completa.

## Componentes principales

- `app/`: rutas, paginas y acciones de servidor.
- `components/`: componentes reutilizables de interfaz.
- `features/`: modulos funcionales por dominio.
- `lib/auth/`: autenticacion, sesiones y permisos.
- `lib/db/`: cliente Prisma y utilidades transaccionales.
- `lib/validation/`: esquemas Zod compartidos.
- `server/use-cases/`: casos de uso de negocio.
- `server/repositories/`: acceso a datos encapsulado.
- `server/audit/`: registro de auditoria.
- `prisma/`: schema, migraciones y seed.
- `tests/`: pruebas unitarias e integracion.

## Capas

### Presentacion

Pantallas y formularios React. Puede calcular totales preliminares para experiencia de usuario, pero no decide reglas criticas.

### Validacion

Esquemas reutilizables con Zod para entradas de productos, compras, ventas, caja, gastos e inventario.

### Casos de uso

Servicios transaccionales para operaciones criticas:

- Recibir compra.
- Completar venta.
- Anular venta.
- Registrar devolucion.
- Abrir y cerrar caja.
- Registrar gasto.
- Registrar apertura de producto sellado.
- Aprobar ajuste de inventario.

### Acceso a datos

Repositorios o funciones especializadas sobre Prisma. No deben exponer detalles de base de datos a la UI.

## Reglas transaccionales

- Venta completada: venta, items, pagos, movimientos de inventario y movimientos de caja se guardan en una unica transaccion.
- Compra recibida: estado, items, movimientos, ultimo costo y costo promedio se actualizan atomicamente.
- Anulaciones: crean movimientos compensatorios y actualizan estado sin eliminar el documento original.
- Caja: una caja no puede tener mas de una sesion abierta.
- Inventario fisico: el conteo no cambia stock hasta que un usuario autorizado apruebe el ajuste.

## Seguridad

- Contrasenas con hash seguro usando Argon2id o bcrypt.
- Sesiones con expiracion.
- Middleware de proteccion de rutas.
- Permisos validados en servidor.
- Auditoria de acciones sensibles.
- Restricciones de base de datos para unicidad, relaciones y estados.

## Dashboard y reportes

Los reportes consultaran ventas, pagos, gastos y movimientos con indices por fecha, producto, categoria, juego, usuario y medio de pago. Si el volumen crece, se podran agregar tablas de resumen reconstruibles.

## Respaldo y recuperacion

La aplicacion ofrecera respaldo manual y automatico diario de SQLite. La restauracion estara restringida a administradores y validara el archivo antes de reemplazar la base activa.

