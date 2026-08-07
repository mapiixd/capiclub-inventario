import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const permissions = [
  ["users.manage", "Gestionar usuarios"],
  ["settings.manage", "Gestionar configuracion"],
  ["products.create", "Crear productos"],
  ["products.update", "Editar productos"],
  ["products.updateCost", "Modificar costos"],
  ["products.updatePrice", "Modificar precios"],
  ["products.deactivate", "Desactivar productos"],
  ["purchases.create", "Registrar compras"],
  ["purchases.receive", "Recibir compras"],
  ["purchases.void", "Anular compras"],
  ["sales.create", "Registrar ventas"],
  ["sales.discount", "Aplicar descuentos"],
  ["sales.discount.authorize", "Autorizar descuentos extraordinarios"],
  ["sales.void", "Anular ventas"],
  ["returns.create", "Registrar devoluciones"],
  ["cash.open", "Abrir caja"],
  ["cash.close", "Cerrar caja"],
  ["cash.adjust", "Ajustar caja"],
  ["expenses.create", "Registrar gastos"],
  ["inventory.count", "Registrar conteos fisicos"],
  ["inventory.adjust.approve", "Aprobar ajustes de inventario"],
  ["inventory.specialMovement.create", "Registrar movimientos especiales"],
  ["openings.create", "Registrar aperturas de productos sellados"],
  ["reports.view", "Ver reportes"],
  ["reports.export", "Exportar reportes"],
  ["audit.view", "Ver auditoria"],
  ["backup.create", "Crear respaldos"],
  ["backup.restore", "Restaurar respaldos"],
] as const;

const rolePermissions: Record<string, string[]> = {
  Administrador: permissions.map(([key]) => key),
  Encargado: [
    "products.create",
    "products.update",
    "products.updatePrice",
    "purchases.create",
    "purchases.receive",
    "sales.create",
    "sales.discount",
    "sales.discount.authorize",
    "sales.void",
    "returns.create",
    "cash.open",
    "cash.close",
    "cash.adjust",
    "expenses.create",
    "inventory.count",
    "inventory.adjust.approve",
    "inventory.specialMovement.create",
    "openings.create",
    "reports.view",
    "reports.export",
  ],
  Vendedor: [
    "sales.create",
    "sales.discount",
    "cash.open",
    "cash.close",
    "inventory.count",
  ],
};

async function main() {
  for (const [key, description] of permissions) {
    await prisma.permission.upsert({
      where: { key },
      update: { description },
      create: { key, description },
    });
  }

  for (const [roleName, keys] of Object.entries(rolePermissions)) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: {
        name: roleName,
        description: `Rol ${roleName.toLowerCase()} inicial`,
      },
    });

    const permissionRows = await prisma.permission.findMany({
      where: { key: { in: keys } },
    });

    for (const permission of permissionRows) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });
    }
  }

  const adminRole = await prisma.role.findUniqueOrThrow({
    where: { name: "Administrador" },
  });
  const adminEmail = process.env.INITIAL_ADMIN_EMAIL ?? "admin@capiclub.local";
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD ?? "Cambiar.12345";
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { roleId: adminRole.id },
    create: {
      email: adminEmail,
      name: "Administrador CapiClub",
      passwordHash,
      roleId: adminRole.id,
    },
  });

  const settings = [
    ["app.timeZone", "America/Santiago", "string", "Zona horaria operativa"],
    ["app.currency", "CLP", "string", "Moneda operativa"],
    ["inventory.allowNegativeStock", "false", "boolean", "Permite stock negativo"],
    ["sales.maxSellerDiscountPercent", "10", "number", "Descuento maximo vendedor"],
  ] as const;

  for (const [key, value, valueType, description] of settings) {
    await prisma.systemSetting.upsert({
      where: { key },
      update: { value, valueType, description },
      create: { key, value, valueType, description },
    });
  }

  for (const name of [
    "Efectivo",
    "Tarjeta de debito",
    "Tarjeta de credito",
    "Transferencia",
    "Otro",
  ]) {
    await prisma.paymentMethod.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  await prisma.cashRegister.upsert({
    where: { name: "Caja principal" },
    update: {},
    create: { name: "Caja principal" },
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
