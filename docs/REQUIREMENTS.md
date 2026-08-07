# Requerimientos

## Entendimiento del problema

CapiClub necesita una aplicacion local para operar ventas, compras, stock, caja y reportes sin depender de internet. La prioridad es evitar inconsistencias: el sistema debe registrar cada cambio relevante con trazabilidad, permisos y transacciones.

La aplicacion reemplaza una solucion pensada originalmente en Excel. Por eso debe ser facil de operar por vendedores, pero con reglas de negocio mas estrictas que una planilla.

## Objetivos funcionales

- Gestionar productos TCG, accesorios, merchandising, servicios y otros articulos.
- Registrar compras a proveedores y recepcionarlas.
- Registrar ventas con multiples productos, descuentos y pagos mixtos.
- Controlar inventario mediante movimientos historicos.
- Gestionar caja con apertura, movimientos y cierre.
- Registrar gastos operacionales.
- Gestionar devoluciones parciales y totales.
- Registrar danos, mermas, uso interno, premios y productos gratuitos.
- Transformar productos sellados en singles u otros productos.
- Realizar inventarios fisicos con aprobacion.
- Administrar usuarios, roles y permisos.
- Auditar acciones sensibles.
- Consultar dashboard y exportaciones.
- Respaldar y restaurar la base local.

## Requerimientos no funcionales

- Ejecucion local en computador principal de la tienda.
- Acceso desde navegador, idealmente desde la red local.
- Operacion offline para ventas, compras, inventario y caja.
- Base de datos local SQLite en la primera version.
- Preparacion para migracion futura a PostgreSQL.
- TypeScript estricto.
- Validacion en cliente y servidor.
- Hash seguro de contrasenas.
- Transacciones atomicas para operaciones comerciales.
- Pruebas unitarias e integracion.
- Interfaz en espanol.
- Montos CLP almacenados como enteros.
- Fechas visibles en formato DD-MM-AAAA.

## Supuestos

- La primera version operara una sola tienda.
- La concurrencia esperada sera de uno a tres usuarios.
- No se requiere facturacion electronica en el MVP.
- No se requiere integracion con terminales bancarios.
- El computador principal tendra Node.js o Docker instalado.
- Un administrador local gestionara respaldos, restauracion y usuarios.
- El stock negativo estara deshabilitado por defecto.

## Riesgos tecnicos

- SQLite permite concurrencia limitada; se mitigara con transacciones cortas, validacion final de stock y una sola base local.
- El uso desde red local exige configurar firewall, hostname o IP fija.
- Respaldos y restauracion deben impedir corrupcion accidental de la base activa.
- La apertura de productos sellados puede generar discrepancias de valorizacion si no se controla la asignacion de costos.
- Los reportes pueden volverse pesados si se consultan movimientos historicos sin indices o agregaciones.
- La facilidad de uso de POS requiere atajos, busqueda rapida y mensajes claros desde el inicio.

## Criterios de aceptacion obligatorios

1. Una compra recibida de 10 unidades aumenta el stock en 10.
2. Una compra en borrador no modifica el stock.
3. Una venta de 2 unidades reduce el stock en 2.
4. Una venta con stock insuficiente es rechazada.
5. Una venta con dos medios de pago exige que ambos sumen el total.
6. La anulacion de una venta restaura el stock mediante movimientos compensatorios.
7. La venta original permanece visible despues de su anulacion.
8. Una devolucion parcial restaura solo las unidades devueltas.
9. Un producto danado disminuye el stock disponible.
10. Un premio de torneo disminuye el stock sin aumentar las ventas.
11. Una apertura disminuye el producto sellado y aumenta los singles.
12. Un ajuste de inventario requiere motivo y aprobacion.
13. Un vendedor no puede modificar costos.
14. Un vendedor no puede modificar movimientos historicos.
15. El cierre de caja calcula correctamente el efectivo esperado.
16. Un gasto en efectivo disminuye el efectivo esperado.
17. Una sesion cerrada no puede recibir nuevas ventas.
18. Dos solicitudes simultaneas no pueden vender la misma ultima unidad.
19. El margen historico de una venta no cambia al registrar una compra posterior.
20. Los productos con movimientos no pueden eliminarse.

