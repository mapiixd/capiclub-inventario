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
4. Cuando termine, ejecuta `CapiClub Inventario.exe`.
5. Abre `http://localhost:3000` si el navegador no se abre automaticamente.

## Usuario inicial

- Usuario: `admin@capiclub.local`
- Contrasena: `Cambiar.12345`

Cambia la contrasena inicial despues de instalar el sistema.

## Inicio diario

Ejecuta `CapiClub Inventario.exe`. La ventana debe quedar abierta mientras se use el sistema.

Si el ejecutable no esta disponible, usa `iniciar-capiclub.bat`; ambos terminan ejecutando el mismo flujo de inicio.

Para detener la aplicacion, cierra la ventana o ejecuta `detener-capiclub.bat`.

## Actualizaciones

`CapiClub Inventario.exe` ejecuta `iniciar-capiclub.bat`, que intenta actualizar automaticamente si la carpeta fue instalada con Git.

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
scripts\windows\crear-ejecutable.ps1
"CapiClub Inventario.exe"
```

La base de datos local se crea en `prisma/dev.db` y no se sube al repositorio.

## Regenerar ejecutable

El `.exe` es un lanzador simple. No contiene la aplicacion completa; solo abre el flujo de inicio.

Para regenerarlo:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\windows\crear-ejecutable.ps1
```
