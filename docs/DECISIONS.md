# Decisiones Tecnicas

## ADR-001: Aplicacion web local con Next.js

Decision: usar Next.js con App Router como base del sistema local.

Motivo: entrega una aplicacion accesible por navegador, permite uso desde red local y simplifica construir UI, acciones de servidor, rutas protegidas y reportes en una sola base tecnologica.

Consecuencia: se debe documentar ejecucion local en Windows y cuidar la configuracion de red local.

## ADR-002: SQLite para primera version

Decision: usar SQLite como base local inicial.

Motivo: reduce complejidad operativa para una tienda con baja concurrencia y facilita respaldos mediante archivo.

Consecuencia: las escrituras criticas deben ser transacciones cortas y se debe validar stock en servidor justo antes de confirmar ventas.

## ADR-003: Prisma como ORM

Decision: usar Prisma para modelar datos, migraciones y acceso a SQLite.

Motivo: tiene buen soporte de TypeScript, migraciones y una ruta viable a PostgreSQL.

Consecuencia: se evitara acoplar la logica de negocio a consultas especificas de SQLite.

## ADR-004: Stock basado en movimientos

Decision: el stock no se edita manualmente y se deriva desde `InventoryMovement`.

Motivo: mejora auditoria, trazabilidad y reversibilidad de operaciones.

Consecuencia: cualquier optimizacion de stock resumido debe poder reconstruirse desde movimientos.

## ADR-005: Operaciones comerciales sin eliminacion fisica

Decision: compras, ventas, devoluciones, caja, gastos y movimientos confirmados no se eliminan fisicamente.

Motivo: la tienda necesita trazabilidad y auditoria historica.

Consecuencia: los errores se corrigen con anulaciones, estados y movimientos compensatorios.

## ADR-006: Montos como enteros CLP

Decision: guardar montos monetarios como enteros sin decimales.

Motivo: CLP no requiere decimales en la operacion normal y se evitan errores de punto flotante.

Consecuencia: todos los calculos de descuentos, pagos y totales deben redondear de forma explicita cuando usen porcentajes.

## ADR-007: Validacion compartida con Zod

Decision: usar esquemas Zod para validar entradas en cliente y servidor.

Motivo: reduce duplicacion y evita confiar solo en formularios.

Consecuencia: las reglas criticas igualmente viven en casos de uso de servidor.

## ADR-008: Auditoria obligatoria para acciones sensibles

Decision: registrar auditoria para productos, precios, costos, ventas, compras, anulaciones, caja, gastos, ajustes, aperturas, configuracion y usuarios.

Motivo: permite investigar errores y mantener control operativo.

Consecuencia: los casos de uso sensibles deben recibir usuario, motivo cuando aplique y contexto de terminal o IP si esta disponible.

## ADR-009: Sesiones persistentes con token hasheado

Decision: guardar sesiones locales en base de datos usando token aleatorio en cookie y hash SHA-256 en la tabla `Session`.

Motivo: evita exponer el ID de usuario directamente en la cookie y permite expiracion e invalidacion server-side.

Consecuencia: el middleware solo hace una validacion rapida de presencia de cookie; la validacion autoritativa ocurre en servidor al leer la sesion desde la base.

## ADR-010: Hash de contrasenas con bcryptjs en MVP

Decision: usar `bcryptjs` para hash de contrasenas en la primera version.

Motivo: evita dependencias nativas fragiles en Windows durante la instalacion local inicial.

Consecuencia: se mantiene costo configurado en 12 rondas; se puede migrar a Argon2id mas adelante si el empaquetado local lo soporta sin friccion.

## ADR-011: Edicion de producto sin SKU ni stock

Decision: la edicion de productos permite datos comerciales actuales, pero no permite modificar SKU ni stock.

Motivo: el SKU es identificador comercial inmutable y el stock debe derivarse exclusivamente de movimientos de inventario.

Consecuencia: cualquier ajuste de existencia debe registrarse como `InventoryMovement` con motivo, usuario, stock anterior y stock resultante.

## ADR-012: Recepcion de compra como frontera transaccional

Decision: una compra en borrador no genera inventario; el stock y los costos cambian solo al recibir la compra.

Motivo: separa carga administrativa de efecto operacional y evita existencias fantasma.

Consecuencia: la recepcion actualiza estado, movimientos, ultimo costo y costo promedio dentro de una unica transaccion de base de datos.
