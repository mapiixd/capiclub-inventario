# CapiClub Inventario

Sistema local de inventario, compras, ventas, caja y reportes para CapiClub.

## Desarrollo

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

La aplicacion queda disponible en `http://localhost:3000`.

## Produccion local

```bash
npm run build
npm run start
```

## Entrega Windows

Para preparar una carpeta entregable:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/prepare-local-release.ps1
```

La carpeta `dist-local/` incluira:

- `CapiClub Inventario.exe`
- `instalar.bat`
- `iniciar-capiclub.bat`
- `actualizar-capiclub.bat`
- `detener-capiclub.bat`
- `verificar-requisitos.bat`

Si la instalacion del cliente conserva `.git`, `iniciar-capiclub.bat` intentara hacer `git pull --ff-only` desde `origin/main` antes de iniciar. Si se entrega como ZIP, omitira la actualizacion automatica.

Para regenerar el lanzador `.exe`:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/windows/crear-ejecutable.ps1
```

## Usuario inicial

- Usuario: `admin@capiclub.local`
- Contrasena: `Cambiar.12345`

Cambia la contrasena inicial despues de instalar el sistema.

## Documentacion

- [Requerimientos](docs/REQUIREMENTS.md)
- [Arquitectura](docs/ARCHITECTURE.md)
- [Modelo de datos](docs/DATA_MODEL.md)
- [Permisos](docs/PERMISSIONS.md)
- [Plan de implementacion](docs/IMPLEMENTATION_PLAN.md)
- [Decisiones tecnicas](docs/DECISIONS.md)
- [Instalacion Windows](docs/INSTALL_WINDOWS.md)
- [Acceso desde red local](docs/NETWORK_ACCESS.md)
- [Respaldos](docs/BACKUPS.md)
- [Manual breve](docs/USER_MANUAL.md)
- [Limitaciones conocidas](docs/KNOWN_LIMITATIONS.md)

## Alcance MVP

El MVP incluye productos, compras, ventas, inventario, movimientos de stock, caja, medios de pago, gastos, devoluciones, ajustes, aperturas de productos sellados, premios, usuarios, permisos, auditoria, dashboard, reportes, respaldos y exportaciones CSV.

Quedan fuera integraciones con facturacion electronica, marketplaces, aplicacion movil nativa, programa de puntos, multiples sucursales y sincronizacion en la nube.
