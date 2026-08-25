# Respaldos y Restauracion

## Ubicacion

La base activa SQLite esta en `prisma/dev.db`.

Los respaldos se guardan en la carpeta configurada por `BACKUP_DIR`. Por defecto: `backups/`.

## Crear respaldo

1. Entra con un usuario administrador.
2. Abre Administracion > Respaldos.
3. Presiona `Crear respaldo ahora`.
4. Copia el archivo generado a una ubicacion externa.

## Respaldo automatico

La pantalla de Respaldos crea un respaldo diario si aun no existe uno para el dia.

Cuando `CapiClub Inventario.exe` detecta una actualizacion disponible desde Git, el script crea antes un respaldo automatico de `prisma/dev.db`.

- Nombre: `capiclub-auto-update-AAAA-MM-DDTHH-mm-ss-fffZ.db`.
- Ubicacion: carpeta `backups/`.
- Retencion: se conservan maximo 5 respaldos automaticos de actualizacion.
- Los respaldos manuales no se borran por esta limpieza automatica.
- Si existe base de datos pero falla el respaldo, la actualizacion se cancela.

## Restaurar

1. Entra a Administracion > Respaldos.
2. Elige el respaldo.
3. Presiona `Restaurar`.
4. Reinicia la aplicacion con `detener-capiclub.bat` y luego `iniciar-capiclub.bat`.

Antes de restaurar, el sistema crea un respaldo de seguridad de la base actual.

## Reglas de seguridad

- Solo usuarios con permiso `backup.restore` pueden restaurar.
- Solo se restauran archivos de respaldo generados por el sistema.
- El archivo se valida como SQLite antes de reemplazar la base activa.
