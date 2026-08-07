# Instalacion en Windows

## Requisitos

- Windows 10 o superior.
- Node.js LTS instalado desde https://nodejs.org/.
- Permisos para ejecutar archivos `.bat`.
- Puerto `3000` disponible.

## Instalacion inicial

1. Descomprime la carpeta de entrega de CapiClub Inventario.
2. Ejecuta `verificar-requisitos.bat`.
3. Ejecuta `instalar.bat`.
4. Cuando termine, ejecuta `iniciar-capiclub.bat`.
5. Abre `http://localhost:3000` si el navegador no se abre automaticamente.

## Usuario inicial

- Usuario: `admin@capiclub.local`
- Contrasena: `Cambiar.12345`

Cambia la contrasena inicial despues de instalar el sistema.

## Inicio diario

Ejecuta `iniciar-capiclub.bat`. La ventana debe quedar abierta mientras se use el sistema.

Para detener la aplicacion, cierra la ventana o ejecuta `detener-capiclub.bat`.

## Actualizaciones

Antes de actualizar:

1. Entra a Administracion > Respaldos.
2. Crea un respaldo manual.
3. Guarda una copia del respaldo en una ubicacion externa.
4. Reemplaza los archivos de la aplicacion.
5. Ejecuta nuevamente `instalar.bat`.
