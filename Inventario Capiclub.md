Actúa como arquitecto de software, analista funcional y desarrollador full-stack senior. Necesito que planifiques y desarrolles un sistema local de gestión comercial e inventario para **CapiClub**, una tienda especializada en Trading Card Games —TCG—.

El sistema reemplazará una solución inicialmente pensada en Excel. Debe ser una aplicación ligera, estable, fácil de usar y ejecutable localmente en la tienda, sin depender obligatoriamente de servicios en la nube.

# 1. Objetivo general

Desarrollar una aplicación que permita controlar:

* Productos.
* Compras.
* Ventas.
* Inventario.
* Movimientos de stock.
* Caja.
* Medios de pago.
* Gastos.
* Devoluciones.
* Ajustes de inventario.
* Apertura de productos sellados para obtener singles.
* Premios y productos utilizados en torneos.
* Usuarios y permisos.
* Auditoría de operaciones.
* Indicadores y dashboard.

La prioridad de la primera versión debe ser:

1. Integridad de los datos.
2. Trazabilidad.
3. Estabilidad.
4. Facilidad de uso.
5. Prevención de errores.
6. Mantenibilidad.
7. Funcionalidades avanzadas.

No se debe priorizar una interfaz visual compleja por sobre la consistencia de los movimientos de inventario y caja.

# 2. Arquitectura recomendada

Utiliza como base una aplicación web local full-stack.

Stack sugerido:

* Next.js con App Router.
* TypeScript estricto.
* React.
* Base de datos SQLite para la primera versión.
* ORM compatible con SQLite y con futura migración a PostgreSQL.
* Componentes de interfaz accesibles y mantenibles.
* Validación de formularios tanto en cliente como en servidor.
* Autenticación local mediante usuario y contraseña.
* Pruebas unitarias e integración.
* Ejecución mediante Node.js o Docker, dependiendo de cuál entregue una instalación más sencilla y estable.

Utiliza las versiones estables y compatibles más recientes de las herramientas seleccionadas.

La aplicación debe ejecutarse en un computador principal dentro de CapiClub y poder abrirse desde un navegador. Idealmente, debe poder ser utilizada desde otros computadores de la misma red local.

No debe depender de internet para registrar ventas, compras, inventario o cierres de caja.

Diseña la capa de acceso a datos de manera que SQLite pueda ser reemplazado posteriormente por PostgreSQL sin modificar toda la lógica de negocio.

La aplicación debe estar preparada inicialmente para una tienda y entre uno y tres usuarios concurrentes.

# 3. Configuración regional

Considera las siguientes configuraciones:

* Idioma de interfaz: español.
* Moneda: peso chileno, CLP.
* Los valores monetarios deben almacenarse como números enteros, sin decimales.
* Zona horaria: America/Santiago.
* Formato de fecha visible: DD-MM-AAAA.
* Cada operación debe almacenar internamente fecha y hora completa.
* Los identificadores internos deben ser independientes de los números correlativos visibles.

# 4. Principio fundamental de inventario

El stock de un producto no debe editarse manualmente desde la ficha del producto.

El stock debe calcularse exclusivamente a partir de movimientos de inventario.

Cada movimiento debe indicar:

* Producto.
* Cantidad.
* Tipo de movimiento.
* Fecha y hora.
* Usuario responsable.
* Documento u operación de origen.
* Motivo.
* Observaciones.
* Stock anterior.
* Stock resultante, cuando corresponda.
* Identificador de la operación relacionada.
* Movimiento original que está revirtiendo, cuando corresponda.

Tipos mínimos de movimiento:

* Compra recibida.
* Venta.
* Devolución de cliente.
* Devolución a proveedor.
* Producto dañado.
* Merma.
* Uso interno.
* Premio de torneo.
* Apertura de producto sellado.
* Ingreso de singles obtenidos mediante apertura.
* Ajuste positivo por inventario físico.
* Ajuste negativo por inventario físico.
* Anulación de compra.
* Anulación de venta.
* Transferencia o reclasificación.
* Movimiento compensatorio.

No permitas modificar o eliminar directamente un movimiento histórico.

Cuando exista un error, se debe registrar:

* Una anulación formal; o
* Un movimiento compensatorio.

El movimiento original debe permanecer disponible para auditoría.

# 5. Gestión de productos

Cada producto debe contar con un código interno o SKU único e inmutable.

El sistema puede permitir ingreso manual o generación automática del código, pero nunca debe permitir duplicados.

Campos mínimos:

* ID interno.
* SKU.
* Código de barras opcional.
* Nombre.
* Juego.
* Categoría.
* Subcategoría opcional.
* Edición o colección.
* Marca o fabricante.
* Idioma.
* Condición.
* Rareza.
* Variante.
* Tipo de producto.
* Costo promedio.
* Último costo de compra.
* Precio de venta.
* Stock mínimo.
* Estado activo o inactivo.
* Fecha de creación.
* Usuario creador.
* Notas.

Tipos de producto sugeridos:

* Producto sellado.
* Single.
* Accesorio.
* Merchandising.
* Inscripción o servicio.
* Otro.

Los campos específicos de TCG deben ser opcionales, ya que no todos los productos necesitan edición, rareza, idioma o condición.

Un producto no debe eliminarse si posee movimientos. Solo podrá marcarse como inactivo.

Cada combinación que represente un producto comercialmente diferente debe utilizar un SKU diferente. Por ejemplo, una carta con idioma, edición, condición o variante distinta debe tratarse como un producto diferente.

# 6. Compras

El sistema debe permitir registrar compras a proveedores con varios productos.

Cada compra debe incluir:

* Número interno.
* Proveedor.
* Número de documento del proveedor.
* Fecha del documento.
* Fecha de recepción.
* Usuario responsable.
* Estado.
* Subtotal.
* Descuento.
* Costos adicionales opcionales.
* Total.
* Observaciones.
* Productos, cantidades y costos unitarios.

Estados sugeridos:

* Borrador.
* Confirmada.
* Recibida.
* Anulada.

El inventario debe aumentar solamente cuando la compra sea confirmada como recibida.

No se deben generar movimientos de inventario mientras la compra sea un borrador.

Al recibir una compra:

* Registrar movimientos positivos.
* Actualizar último costo.
* Recalcular costo promedio ponderado.
* Mantener el costo histórico asociado a cada operación.

La anulación de una compra recibida debe generar movimientos compensatorios. No debe eliminar la compra original.

# 7. Ventas

El sistema debe permitir crear una venta con varios productos.

Cada venta debe incluir:

* Número correlativo.
* Fecha y hora.
* Usuario.
* Caja o sesión de caja.
* Productos.
* Cantidades.
* Precio unitario.
* Descuento por línea.
* Descuento general.
* Total bruto.
* Total de descuentos.
* Total final.
* Costo estimado de los productos vendidos.
* Margen estimado.
* Medios de pago.
* Estado.
* Observaciones.

Estados sugeridos:

* Pendiente.
* Completada.
* Anulada.
* Devuelta parcialmente.
* Devuelta totalmente.

Una venta completada debe disminuir automáticamente el inventario.

No se debe permitir completar una venta con stock insuficiente, salvo que un administrador active explícitamente una configuración para permitir stock negativo. Por defecto, el stock negativo debe estar deshabilitado.

Antes de completar una venta, valida nuevamente el stock desde el servidor para evitar ventas simultáneas sobre la misma existencia.

La creación de la venta, los pagos, los movimientos de stock y la actualización de caja deben ejecutarse dentro de una única transacción de base de datos. Si alguna parte falla, no debe guardarse parcialmente la operación.

# 8. Descuentos

Permite:

* Descuento por producto.
* Descuento general de la venta.
* Descuento mediante porcentaje.
* Descuento mediante monto fijo.

Registra siempre:

* Precio original.
* Descuento aplicado.
* Precio final.
* Usuario que autorizó el descuento.

Permite definir un porcentaje máximo de descuento para vendedores. Un descuento superior debe requerir autorización de un administrador o encargado.

# 9. Medios de pago y pagos mixtos

Medios mínimos:

* Efectivo.
* Tarjeta de débito.
* Tarjeta de crédito.
* Transferencia.
* Otro.

Una venta puede pagarse utilizando uno o varios medios de pago.

Ejemplo:

* Total de venta: $25.000.
* Efectivo: $10.000.
* Débito: $15.000.

La suma de los pagos debe coincidir exactamente con el total de la venta antes de completarla.

Cada pago debe registrar:

* Medio de pago.
* Monto.
* Referencia opcional.
* Fecha y hora.
* Usuario.
* Venta relacionada.
* Sesión de caja.

El vuelto en efectivo debe registrarse separadamente y considerarse correctamente en el cálculo de caja.

# 10. Caja

Implementa sesiones de caja.

Cada sesión debe incluir:

* Caja o terminal.
* Usuario que abre.
* Fecha y hora de apertura.
* Fondo inicial.
* Estado.
* Fecha y hora de cierre.
* Usuario que cierra.
* Efectivo esperado.
* Efectivo contado.
* Diferencia.
* Observaciones.

Solo debe existir una sesión activa por caja o terminal.

Las operaciones en efectivo deben estar asociadas a una sesión abierta.

El efectivo esperado debe calcularse considerando, como mínimo:

Fondo inicial

* ventas pagadas en efectivo
* ingresos manuales autorizados

- devoluciones pagadas en efectivo
- gastos pagados desde caja
- retiros de efectivo
- vuelto entregado, cuando corresponda según el modelo utilizado

El cierre debe mostrar:

* Fondo inicial.
* Ventas totales.
* Ventas por medio de pago.
* Total recibido en efectivo.
* Total recibido por débito.
* Total recibido por crédito.
* Total recibido por transferencia.
* Otros pagos.
* Devoluciones.
* Gastos pagados desde caja.
* Ingresos y retiros manuales.
* Efectivo esperado.
* Efectivo contado.
* Diferencia.
* Usuario que realizó el cierre.
* Fecha y hora.

Una sesión cerrada no debe poder modificarse. Las correcciones posteriores deben efectuarse mediante operaciones de ajuste autorizadas y auditadas.

# 11. Gastos

Permite registrar gastos operacionales.

Campos mínimos:

* Fecha y hora.
* Categoría.
* Descripción.
* Monto.
* Medio de pago.
* Proveedor o beneficiario opcional.
* Número de documento opcional.
* Usuario.
* Sesión de caja, cuando el gasto se pague en efectivo.
* Comprobante opcional.
* Observaciones.
* Estado.

Un gasto pagado desde caja debe disminuir el efectivo esperado.

Categorías sugeridas:

* Arriendo.
* Servicios.
* Insumos.
* Premios.
* Marketing.
* Transporte.
* Mantención.
* Compra menor.
* Otro.

Los gastos no deben modificar inventario, salvo que se registren formalmente como una compra de productos.

# 12. Devoluciones

Implementa devoluciones parciales y totales.

Una devolución debe:

* Mantener referencia a la venta original.
* Identificar los productos y cantidades devueltas.
* Registrar motivo.
* Registrar usuario.
* Registrar fecha y hora.
* Registrar forma de reembolso.
* Generar movimientos de inventario cuando corresponda.
* Generar movimientos de caja cuando corresponda.

El usuario debe indicar si el producto devuelto:

* Regresa al inventario vendible.
* Ingresa como producto dañado.
* Se considera merma.
* Queda pendiente de revisión.

Nunca se debe eliminar la venta original.

# 13. Productos dañados, uso interno y premios

Permite registrar salidas de inventario no asociadas a ventas.

Casos mínimos:

* Producto dañado.
* Merma.
* Uso interno.
* Material promocional.
* Premio de torneo.
* Producto entregado gratuitamente.

Cada movimiento debe requerir:

* Producto.
* Cantidad.
* Motivo.
* Evento o torneo relacionado, cuando corresponda.
* Usuario.
* Fecha y hora.
* Observaciones.

Estos movimientos deben afectar inventario, pero no deben registrarse como ventas.

El sistema debe permitir consultar posteriormente cuánto inventario y valor de costo se ha utilizado en premios, daños o uso interno.

# 14. Apertura de productos sellados para singles

Implementa una operación de transformación de inventario.

Una apertura debe permitir seleccionar:

* Producto sellado utilizado.
* Cantidad abierta.
* Usuario.
* Fecha y hora.
* Motivo.
* Evento o colección relacionada.
* Singles u otros productos obtenidos.
* Cantidad obtenida de cada producto.
* Observaciones.

Al confirmar la apertura:

* Disminuir el inventario del producto sellado.
* Aumentar el inventario de los singles u otros productos obtenidos.
* Mantener todos los movimientos vinculados a una misma operación de apertura.

Para la primera versión, implementa una asignación de costos simple y auditable:

* Permitir asignar manualmente el costo a los productos obtenidos; o
* Distribuir automáticamente el costo del producto sellado según la proporción del precio de venta de los productos obtenidos.

La suma del costo asignado a los productos resultantes debe coincidir con el costo total de los productos sellados consumidos.

El método utilizado debe quedar registrado.

# 15. Inventario físico

Incluye un módulo para realizar conteos físicos.

Flujo sugerido:

1. Crear sesión de inventario.
2. Seleccionar productos o categoría.
3. Registrar cantidad contada.
4. Comparar con stock teórico.
5. Mostrar diferencia.
6. Solicitar motivo.
7. Aprobar el ajuste.
8. Generar movimientos positivos o negativos.

El vendedor puede realizar el conteo, pero solo un encargado o administrador debe poder aprobar el ajuste.

Mantén historial de:

* Stock teórico.
* Stock contado.
* Diferencia.
* Usuario que contó.
* Usuario que aprobó.
* Fecha y hora.
* Motivo.

# 16. Costos y margen estimado

Utiliza costo promedio ponderado para la valorización de inventario.

Al completar una venta, guarda en cada línea el costo utilizado en ese momento. Esto permitirá que el margen histórico no cambie cuando ingresen compras futuras con otros costos.

Cálculos mínimos:

* Venta neta.
* Costo estimado de venta.
* Margen bruto estimado.
* Porcentaje de margen.

La anulación o devolución debe revertir proporcionalmente los valores correspondientes.

Aclara en la interfaz que se trata de margen estimado y no de contabilidad tributaria oficial.

# 17. Usuarios, roles y permisos

Roles mínimos:

## Administrador

Puede:

* Gestionar usuarios.
* Gestionar productos y costos.
* Registrar y anular compras.
* Registrar y anular ventas.
* Aprobar ajustes.
* Ver todos los movimientos.
* Ver costos y márgenes.
* Gestionar respaldos.
* Configurar el sistema.
* Cerrar o reabrir procesos mediante movimientos autorizados.

## Encargado

Puede:

* Gestionar productos.
* Registrar compras.
* Registrar ventas.
* Registrar devoluciones.
* Aprobar inventarios físicos.
* Registrar gastos.
* Abrir y cerrar caja.
* Ver reportes operacionales.
* Ver costos y márgenes si se autoriza.

## Vendedor o cajero

Puede:

* Consultar productos y stock.
* Registrar ventas.
* Aplicar descuentos dentro de su límite.
* Abrir y cerrar su caja.
* Registrar conteos físicos.
* Consultar sus operaciones.

No puede:

* Modificar costos.
* Modificar precios históricos.
* Editar movimientos históricos.
* Eliminar compras o ventas.
* Aprobar ajustes de inventario.
* Modificar fórmulas o cálculos.
* Ver información restringida.
* Gestionar usuarios.

Los permisos deben validarse en el servidor. No basta con ocultar botones en la interfaz.

# 18. Auditoría

Crea un registro de auditoría para acciones sensibles.

Debe registrar:

* Usuario.
* Acción.
* Entidad afectada.
* ID de la entidad.
* Fecha y hora.
* Datos anteriores.
* Datos posteriores.
* Motivo.
* Dirección IP o terminal, si se encuentra disponible.

Audita, como mínimo:

* Creación y modificación de productos.
* Cambios de precio.
* Cambios de costo.
* Compras.
* Ventas.
* Anulaciones.
* Devoluciones.
* Descuentos extraordinarios.
* Ajustes de inventario.
* Aperturas.
* Gastos.
* Aperturas y cierres de caja.
* Cambios de configuración.
* Gestión de usuarios.

No permitas que usuarios normales modifiquen o eliminen el registro de auditoría.

# 19. Dashboard

Desarrolla un dashboard sencillo y rápido.

Indicadores mínimos:

* Ventas del día.
* Ventas del mes.
* Número de ventas.
* Ticket promedio.
* Margen bruto estimado.
* Unidades vendidas.
* Productos más vendidos.
* Productos con mayor facturación.
* Ventas por juego.
* Ventas por categoría.
* Ventas por medio de pago.
* Valor del inventario a costo.
* Valor del inventario a precio de venta.
* Productos bajo stock mínimo.
* Productos sin stock.
* Gastos del período.
* Productos entregados como premios.
* Valor de productos dañados o utilizados internamente.

Incluye filtros por:

* Rango de fechas.
* Juego.
* Categoría.
* Usuario.
* Medio de pago.

No realices consultas excesivamente pesadas. Agrega índices y optimiza las consultas necesarias.

# 20. Búsqueda y experiencia de venta

La pantalla de venta debe priorizar velocidad.

Debe permitir buscar productos por:

* SKU.
* Código de barras.
* Nombre.
* Juego.
* Edición.
* Categoría.

Incluye:

* Navegación por teclado.
* Cantidad editable.
* Eliminación de líneas antes de confirmar.
* Visualización clara del stock.
* Descuentos.
* Totales en tiempo real.
* Selección de medios de pago.
* Pagos mixtos.
* Confirmación final.
* Mensajes de error comprensibles.
* Prevención de doble envío del formulario.

No uses términos técnicos de base de datos en los mensajes visibles para los vendedores.

# 21. Seguridad e integridad

Implementa:

* Contraseñas almacenadas con hash seguro.
* Sesiones con expiración.
* Protección de rutas.
* Validación de permisos en servidor.
* Validación de entradas.
* Protección contra inyección.
* Restricciones y claves foráneas en base de datos.
* Transacciones atómicas.
* Índices únicos.
* Manejo centralizado de errores.
* Registro de errores técnicos.
* Protección frente a doble confirmación.
* Copias de seguridad.

No confíes únicamente en validaciones del frontend.

# 22. Respaldos

Incluye una función de respaldo local.

Requisitos:

* Respaldo manual desde administración.
* Respaldo automático diario.
* Carpeta de destino configurable.
* Nombre del archivo con fecha y hora.
* Conservación configurable de respaldos.
* Restauración disponible solo para administradores.
* Validación del archivo antes de restaurarlo.
* Advertencia clara antes de reemplazar la base actual.

Documenta cómo recuperar el sistema si el computador principal falla.

# 23. Exportaciones

Permite exportar a CSV o Excel, como mínimo:

* Productos.
* Stock actual.
* Movimientos de inventario.
* Compras.
* Ventas.
* Pagos.
* Cierres de caja.
* Gastos.
* Inventarios físicos.
* Auditoría.

Las exportaciones no deben permitir modificar directamente los registros internos del sistema.

# 24. Reglas de eliminación

No implementes eliminación física para operaciones comerciales.

Utiliza:

* Estados.
* Anulaciones.
* Reversiones.
* Movimientos compensatorios.
* Desactivación de registros maestros.

Solo se podrán eliminar borradores que todavía no hayan generado movimientos, pagos ni efectos contables.

Toda eliminación de un borrador debe quedar auditada.

# 25. Entidades mínimas sugeridas

Diseña un modelo de datos que considere, como mínimo:

* User.
* Role.
* Permission.
* Product.
* ProductCategory.
* Game.
* Supplier.
* Purchase.
* PurchaseItem.
* Sale.
* SaleItem.
* Payment.
* PaymentMethod.
* InventoryMovement.
* InventoryCount.
* InventoryCountItem.
* CashRegister.
* CashSession.
* CashMovement.
* Expense.
* ExpenseCategory.
* Return.
* ReturnItem.
* ProductOpening.
* ProductOpeningInput.
* ProductOpeningOutput.
* AuditLog.
* SystemSetting.

Puedes modificar esta estructura si encuentras un diseño más consistente, pero documenta las decisiones.

No almacenes el stock como un valor manual editable. Si utilizas una tabla resumida o un campo de stock para mejorar el rendimiento, debe ser un valor derivado, actualizado transaccionalmente y completamente reconstruible desde los movimientos.

# 26. Casos de aceptación obligatorios

Implementa pruebas que validen al menos estos escenarios:

1. Una compra recibida de 10 unidades aumenta el stock en 10.
2. Una compra en borrador no modifica el stock.
3. Una venta de 2 unidades reduce el stock en 2.
4. Una venta con stock insuficiente es rechazada.
5. Una venta con dos medios de pago exige que ambos sumen el total.
6. La anulación de una venta restaura el stock mediante movimientos compensatorios.
7. La venta original permanece visible después de su anulación.
8. Una devolución parcial restaura solo las unidades devueltas.
9. Un producto dañado disminuye el stock disponible.
10. Un premio de torneo disminuye el stock sin aumentar las ventas.
11. Una apertura disminuye el producto sellado y aumenta los singles.
12. Un ajuste de inventario requiere motivo y aprobación.
13. Un vendedor no puede modificar costos.
14. Un vendedor no puede modificar movimientos históricos.
15. El cierre de caja calcula correctamente el efectivo esperado.
16. Un gasto en efectivo disminuye el efectivo esperado.
17. Una sesión cerrada no puede recibir nuevas ventas.
18. Dos solicitudes simultáneas no pueden vender la misma última unidad.
19. El margen histórico de una venta no cambia al registrar una compra posterior.
20. Los productos con movimientos no pueden eliminarse.

# 27. Exclusiones de la primera versión

No desarrollar inicialmente, salvo que sea indispensable:

* Integración con facturación electrónica.
* Integración con marketplaces.
* Integración con WooCommerce.
* Aplicación móvil nativa.
* Programa de puntos.
* Gestión contable completa.
* Gestión avanzada de clientes.
* Múltiples sucursales.
* Sincronización en la nube.
* Inteligencia artificial.
* Precios automáticos desde mercados externos.
* Integración con terminales bancarios.
* Control individual por número de serie.

Diseña el sistema para que estas funciones puedan agregarse en el futuro sin incluirlas en el MVP.

# 28. Forma de trabajo solicitada

No comiences a programar toda la aplicación inmediatamente.

Primero realiza una fase de planificación y entrega:

1. Resumen de entendimiento del problema.
2. Supuestos realizados.
3. Riesgos técnicos.
4. Arquitectura propuesta.
5. Comparación breve entre:

   * Next.js local con SQLite.
   * Aplicación de escritorio con Tauri.
   * Aplicación local con PostgreSQL.
6. Justificación de la alternativa seleccionada.
7. Modelo de datos.
8. Diagrama de entidades.
9. Flujos principales.
10. Matriz de permisos.
11. Plan de implementación por fases.
12. Estrategia de pruebas.
13. Estrategia de respaldo y recuperación.
14. Criterios de aceptación.

Crea inicialmente los siguientes documentos:

* `README.md`
* `docs/REQUIREMENTS.md`
* `docs/ARCHITECTURE.md`
* `docs/DATA_MODEL.md`
* `docs/PERMISSIONS.md`
* `docs/IMPLEMENTATION_PLAN.md`
* `docs/DECISIONS.md`

Después de la planificación, implementa el proyecto en fases pequeñas y verificables.

# 29. Fases sugeridas

## Fase 1: Fundación

* Proyecto.
* Base de datos.
* Autenticación.
* Usuarios y roles.
* Configuración regional.
* Auditoría básica.
* Diseño base de interfaz.

## Fase 2: Productos e inventario

* Productos.
* Categorías.
* Juegos.
* Movimientos.
* Consulta de stock.
* Historial de producto.
* Alertas de reposición.

## Fase 3: Compras

* Proveedores.
* Compras.
* Recepción.
* Costos.
* Anulaciones.

## Fase 4: Ventas y pagos

* Punto de venta.
* Descuentos.
* Pagos mixtos.
* Validación de stock.
* Anulaciones.
* Devoluciones.

## Fase 5: Caja y gastos

* Apertura.
* Movimientos de caja.
* Gastos.
* Cierre.
* Diferencias.
* Reporte por medio de pago.

## Fase 6: Operaciones especiales

* Daños.
* Uso interno.
* Premios.
* Inventario físico.
* Aperturas de productos sellados.

## Fase 7: Dashboard y reportes

* Indicadores.
* Filtros.
* Exportaciones.
* Optimización de consultas.

## Fase 8: Estabilización

* Pruebas.
* Corrección de errores.
* Respaldos.
* Restauración.
* Documentación.
* Instalación local.
* Datos de demostración.

Cada fase debe poder ejecutarse y probarse antes de avanzar a la siguiente.

# 30. Calidad del código

Requisitos:

* TypeScript estricto.
* Evitar `any`, salvo justificación explícita.
* Separar presentación, lógica de negocio y acceso a datos.
* No incluir reglas críticas exclusivamente en componentes React.
* Servicios o casos de uso para inventario, ventas, caja y compras.
* Esquemas de validación reutilizables.
* Manejo consistente de errores.
* Nombres claros.
* Comentarios solo cuando aporten contexto.
* Migraciones de base de datos.
* Datos de demostración.
* Pruebas unitarias.
* Pruebas de integración.
* Formateador y linter.
* Variables de entorno documentadas.

# 31. Entregable final esperado

El proyecto debe incluir:

* Código fuente completo.
* Migraciones.
* Datos iniciales.
* Usuario administrador inicial.
* Instrucciones de instalación para Windows.
* Instrucciones de ejecución.
* Instrucciones para acceso desde la red local.
* Instrucciones de respaldo y restauración.
* Manual breve de usuario.
* Manual de administrador.
* Pruebas automatizadas.
* Registro de decisiones técnicas.
* Limitaciones conocidas.
* Sugerencias para una segunda versión.

Antes de implementar una funcionalidad, verifica que sea coherente con el principio central:

**Todo cambio de stock, dinero o estado comercial debe ser trazable, transaccional y reversible sin eliminar el registro original.**

Comienza analizando los requerimientos, proponiendo la arquitectura y generando los documentos de planificación. No avances a la implementación completa hasta haber definido el modelo de datos, las reglas de inventario, la matriz de permisos y los criterios de aceptación.
