# Manual Breve de Usuario

## Flujo diario recomendado

1. Iniciar la aplicacion con `iniciar-capiclub.bat`.
2. Iniciar sesion.
3. Abrir caja en Caja.
4. Registrar ventas en Ventas.
5. Registrar compras y recepciones en Compras.
6. Registrar mermas, premios o aperturas en Operaciones.
7. Revisar Dashboard.
8. Cerrar caja al final del dia.
9. Crear respaldo manual si hubo operacion relevante.

## Productos

- El SKU identifica el producto y no debe cambiarse.
- El stock no se edita desde la ficha del producto.
- Todo cambio de stock debe pasar por compras, ventas, devoluciones u operaciones de inventario.
- Para productos como `Singles Pokemon`, desmarca `Controla stock` y usa precio unitario 100. Luego puedes vender 20 unidades para cobrar 2.000 sin cargar stock.

## Ventas

- Agrega productos al carrito.
- Ajusta cantidades.
- Selecciona medio de pago.
- Si el pago es efectivo, debe existir una caja abierta.
- El sistema rechaza ventas con stock insuficiente.

## Compras

- Una compra en borrador no modifica stock.
- Marca `Compra sin costo` cuando solo necesites agregar stock gratuito.
- Selecciona si los costos ingresados son netos + IVA o si ya incluyen IVA.
- La tasa de IVA parte en 19%, pero puede quedar en 0 para documentos exentos.
- Si los costos vienen con IVA incluido, el sistema separa neto e IVA y usa el costo neto para inventario.
- En una compra sin costo, los costos, IVA y total quedan en 0; al recibirla, el stock sube con costo entrante cero.
- Al recibir la compra, el stock aumenta y se actualizan costos.
- Una compra recibida se anula con movimientos compensatorios.

## Caja

- Abre caja con fondo inicial.
- Los pagos en efectivo se asocian a la caja abierta.
- Los gastos bajan el efectivo esperado.
- Al cerrar caja, registra el efectivo contado y revisa la diferencia.

## Operaciones especiales

- Producto danado, merma, uso interno y premio disminuyen stock.
- El conteo fisico queda en borrador hasta ser aprobado.
- La apertura de sellados baja el producto sellado y sube los productos obtenidos.

## Reportes

- Dashboard muestra ventas, ticket promedio, margen estimado, gastos e inventario.
- Las exportaciones CSV estan disponibles para usuarios con permiso.
