# Instalacion en Windows

## Requisitos

- Windows 10 o superior.
- Node.js LTS instalado desde https://nodejs.org/.
- Git para Windows instalado desde https://git-scm.com/ si se quieren actualizaciones automaticas.
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

`iniciar-capiclub.bat` intenta actualizar automaticamente si la carpeta fue instalada con Git.

El flujo automatico es:

1. Verifica si existe `.git`.
2. Ejecuta `git fetch origin main`.
3. Si hay una version nueva y no existen cambios locales, ejecuta `git pull --ff-only`.
4. Si cambiaron dependencias, ejecuta `npm install`.
5. Ejecuta `npm run prisma:generate`, `npx prisma migrate deploy` y `npm run build`.
6. Inicia la aplicacion.

Si la carpeta fue entregada como ZIP o copia directa, no existe `.git`; en ese caso se omite la actualizacion y la aplicacion inicia normalmente.

Antes de una actualizacion grande:

1. Entra a Administracion > Respaldos.
2. Crea un respaldo manual.
3. Guarda una copia del respaldo en una ubicacion externa.
4. Ejecuta `actualizar-capiclub.bat` o inicia el sistema con `iniciar-capiclub.bat`.

## Instalacion con actualizaciones automaticas

Para que el sistema pueda hacer `git pull` al iniciar, instala desde una consola con:

```bat
git clone https://github.com/mapiixd/capiclub-inventario.git
cd capiclub-inventario
scripts\windows\instalar.bat
scripts\windows\iniciar-capiclub.bat
```

La base de datos local se crea en `prisma/dev.db` y no se sube al repositorio.
