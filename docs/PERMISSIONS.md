# Matriz de Permisos

Los permisos se validan siempre en servidor. La interfaz puede ocultar acciones, pero eso no reemplaza la autorizacion real.

## Roles

- Administrador.
- Encargado.
- Vendedor o cajero.

## Matriz

| Accion | Administrador | Encargado | Vendedor |
| --- | --- | --- | --- |
| Gestionar usuarios | Si | No | No |
| Gestionar roles y permisos | Si | No | No |
| Configurar sistema | Si | No | No |
| Crear productos | Si | Si | No |
| Editar datos comerciales de productos | Si | Si | No |
| Modificar costos | Si | Condicional | No |
| Modificar precios actuales | Si | Si | No |
| Desactivar productos | Si | Si | No |
| Eliminar borradores sin efectos | Si | Si | No |
| Ver costos y margenes | Si | Condicional | No |
| Registrar compras | Si | Si | No |
| Recibir compras | Si | Si | No |
| Anular compras | Si | Condicional | No |
| Registrar ventas | Si | Si | Si |
| Aplicar descuentos dentro del limite | Si | Si | Si |
| Autorizar descuentos extraordinarios | Si | Si | No |
| Anular ventas | Si | Si | No |
| Registrar devoluciones | Si | Si | No |
| Abrir caja | Si | Si | Si |
| Cerrar caja | Si | Si | Si |
| Registrar gastos | Si | Si | No |
| Registrar conteos fisicos | Si | Si | Si |
| Aprobar ajustes de inventario | Si | Si | No |
| Registrar danos, mermas o premios | Si | Si | No |
| Registrar apertura de sellados | Si | Si | No |
| Ver dashboard operacional | Si | Si | Limitado |
| Exportar datos | Si | Si | No |
| Crear respaldo | Si | No | No |
| Restaurar respaldo | Si | No | No |
| Ver auditoria | Si | Condicional | No |
| Editar movimientos historicos | No | No | No |
| Eliminar operaciones comerciales confirmadas | No | No | No |

## Reglas especificas

- Nadie puede editar o eliminar movimientos historicos.
- Un vendedor no puede modificar costos ni precios historicos.
- Un vendedor no puede aprobar ajustes de inventario.
- Una sesion de caja cerrada no puede recibir ventas, pagos ni gastos.
- Un producto con movimientos no puede eliminarse; solo puede desactivarse.
- Descuentos sobre el limite del vendedor requieren autorizacion de encargado o administrador.
- Toda anulacion requiere motivo y genera auditoria.

## Permisos atomicos sugeridos

- `users.manage`
- `settings.manage`
- `products.create`
- `products.update`
- `products.updateCost`
- `products.updatePrice`
- `products.deactivate`
- `purchases.create`
- `purchases.receive`
- `purchases.void`
- `sales.create`
- `sales.discount`
- `sales.discount.authorize`
- `sales.void`
- `returns.create`
- `cash.open`
- `cash.close`
- `cash.adjust`
- `expenses.create`
- `inventory.count`
- `inventory.adjust.approve`
- `inventory.specialMovement.create`
- `openings.create`
- `reports.view`
- `reports.export`
- `audit.view`
- `backup.create`
- `backup.restore`

