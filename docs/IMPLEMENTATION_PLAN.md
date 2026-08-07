# Plan de Implementacion

Cada fase debe quedar ejecutable y verificable antes de avanzar.

## Fase 1: Fundacion

- Inicializar proyecto Next.js con TypeScript estricto.
- Configurar linter, formateador y estructura de carpetas.
- Configurar Prisma con SQLite.
- Crear migraciones base.
- Implementar autenticacion local.
- Crear usuarios, roles y permisos.
- Crear usuario administrador inicial.
- Configurar zona horaria, moneda y formato de fechas.
- Implementar auditoria basica.
- Crear layout base y navegacion protegida.

Verificacion:

- Login y cierre de sesion funcionan.
- Permisos se validan en servidor.
- Seed crea datos minimos.
- Pruebas iniciales pasan.

Estado: completada en su base operativa. Quedan mejoras posteriores como cambio de contrasena desde UI y politicas avanzadas de sesion, pero la fundacion ya permite avanzar a modulos comerciales.

## Fase 2: Productos e inventario

- CRUD de productos con SKU unico e inmutable.
- Categorias y juegos.
- Consulta de stock derivado desde movimientos.
- Historial de movimientos por producto.
- Alertas de bajo stock y sin stock.
- Bloqueo de eliminacion de productos con movimientos.

Verificacion:

- SKU duplicado se rechaza.
- Stock no se edita desde ficha de producto.
- Movimientos reconstruyen el stock.

Estado: completada en alcance MVP. Ya existen productos, juegos, categorias, stock derivado, movimientos manuales auditados, busqueda/filtros, detalle con historial por producto, edicion controlada sin modificar SKU ni stock, activacion/desactivacion y alertas de bajo stock/sin stock.

## Fase 3: Compras

- Proveedores.
- Compras en borrador.
- Items de compra.
- Recepcion de compra con movimientos positivos.
- Actualizacion de ultimo costo y costo promedio ponderado.
- Anulacion de compra recibida con movimientos compensatorios.

Verificacion:

- Compra borrador no afecta stock.
- Compra recibida aumenta stock.
- Anulacion conserva compra original y compensa stock.

Estado: completada en alcance MVP. Ya existen proveedores, compras en borrador, edicion de encabezado y lineas en borrador, eliminacion auditada de lineas sin efectos, filtros por proveedor/estado/fecha/texto, recepcion transaccional con movimientos de inventario, actualizacion de ultimo costo/costo promedio y anulacion compensatoria. Queda para estabilizacion agregar pruebas de integracion contra base temporal.

## Fase 4: Ventas y pagos

- Pantalla POS rapida.
- Busqueda por SKU, codigo de barras, nombre, juego, edicion y categoria.
- Carrito con cantidades, descuentos y totales.
- Pagos mixtos.
- Validacion final de stock en servidor.
- Venta completada con transaccion atomica.
- Anulaciones y devoluciones parciales/totales.

Verificacion:

- Stock insuficiente se rechaza.
- Pagos deben sumar exactamente el total.
- Dos ventas simultaneas no venden la ultima unidad dos veces.
- Margen historico queda fijo.

Estado: completada en alcance MVP. Ya existen ventas con pagos mixtos, validacion final de stock, movimientos atomicos, detalle de venta, anulacion total con movimientos compensatorios, devoluciones parciales/totales, estados de venta y auditoria. Queda para estabilizacion agregar pruebas de concurrencia reales contra base temporal.

## Fase 5: Caja y gastos

- Cajas o terminales.
- Apertura de caja con fondo inicial.
- Asociacion de ventas en efectivo a sesion abierta.
- Gastos operacionales.
- Ingresos y retiros manuales autorizados.
- Cierre de caja con efectivo esperado, contado y diferencia.

Verificacion:

- Solo existe una sesion abierta por caja.
- Gasto en efectivo disminuye efectivo esperado.
- Sesion cerrada no recibe nuevas operaciones.

Estado: completada en alcance MVP. Ya existe pantalla de caja con apertura, resumen de efectivo esperado, gastos, ingresos, retiros, cierre con conteo y diferencia, historial de sesiones y auditoria. Las ventas en efectivo requieren caja abierta y quedan asociadas a la sesion; pagos no efectivos siguen operando sin caja.

## Fase 6: Operaciones especiales

- Productos danados, mermas, uso interno y premios.
- Inventario fisico con conteo y aprobacion.
- Apertura de productos sellados.
- Asignacion de costos a productos obtenidos.

Verificacion:

- Premios disminuyen inventario sin aumentar ventas.
- Ajustes requieren motivo y aprobacion.
- Apertura consume sellado y aumenta singles.

Estado: implementada en alcance MVP, pendiente de prueba manual. Ya existe pantalla de operaciones especiales con danos, mermas, uso interno, premios y compensaciones; conteos fisicos en borrador con aprobacion/anulacion; aperturas de sellados que consumen stock y generan productos obtenidos con costo manual asignado; historial mejorado de movimientos con filtros y etiquetas legibles.

## Fase 7: Dashboard y reportes

- Ventas del dia y mes.
- Ticket promedio.
- Margen bruto estimado.
- Productos mas vendidos.
- Ventas por juego, categoria y medio de pago.
- Valor de inventario a costo y precio.
- Productos bajo minimo y sin stock.
- Gastos del periodo.
- Exportaciones CSV o Excel.

Verificacion:

- Filtros por fecha, juego, categoria, usuario y medio de pago.
- Consultas usan indices adecuados.
- Exportaciones no modifican datos internos.

Estado: completada en alcance MVP. El dashboard usa metricas reales de ventas, ticket promedio, margen estimado, gastos, alertas de stock e inventario valorizado; incluye filtros por fecha, rankings por producto, ventas por juego/categoria/medio de pago y exportaciones CSV protegidas por permisos.

## Fase 8: Estabilizacion

- Completar pruebas unitarias e integracion.
- Agregar pruebas end-to-end de flujos criticos.
- Implementar respaldos automaticos y restauracion.
- Documentar instalacion en Windows.
- Documentar acceso desde red local.
- Crear manual breve de usuario y administrador.
- Crear datos de demostracion.
- Registrar limitaciones conocidas y mejoras futuras.

Estado: completada en alcance MVP. Se agregaron respaldos manuales, respaldo diario desde administracion, restauracion protegida con validacion SQLite, auditoria de solicitudes de respaldo/restauracion, scripts Windows para instalar/iniciar/detener/verificar requisitos, preparador de carpeta `dist-local`, documentacion de instalacion, acceso en red, backups, manual breve y limitaciones conocidas. Quedan para mejora posterior instalador `.exe`, pruebas e2e automatizadas y cambio de contrasena desde UI.

## Estrategia de pruebas

- Unitarias para calculos de stock, costos, descuentos, caja y margenes.
- Integracion para casos de uso transaccionales.
- Concurrencia para venta de ultima unidad.
- Pruebas de permisos por rol.
- Pruebas de restauracion de respaldo en base temporal.
- End-to-end para login, venta, compra, caja y devolucion.

## Definition of Done por fase

- Migraciones aplicadas.
- Seed o datos de prueba disponibles.
- Pruebas de la fase pasan.
- Errores visibles son comprensibles para usuarios.
- Operaciones sensibles quedan auditadas.
- Documentacion actualizada si cambia una decision.
