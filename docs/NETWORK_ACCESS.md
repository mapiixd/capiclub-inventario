# Acceso Desde Red Local

La aplicacion se inicia escuchando en `0.0.0.0`, por lo que otros equipos de la red pueden acceder si Windows permite el puerto.

## Pasos

1. En el computador principal, inicia la app con `iniciar-capiclub.bat`.
2. Obtiene la IP local del computador principal:
   - Abre PowerShell.
   - Ejecuta `ipconfig`.
   - Busca la direccion IPv4, por ejemplo `192.168.1.50`.
3. En otro equipo de la misma red, abre `http://192.168.1.50:3000`.

## Firewall

Si no carga desde otro equipo, permite el puerto `3000` en Firewall de Windows para redes privadas.

## Recomendaciones

- Usar una IP fija o reserva DHCP para el computador principal.
- Usar la app solo en red privada de la tienda.
- No exponer el puerto `3000` a internet.
