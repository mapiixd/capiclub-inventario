import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().trim().min(2, "Ingresa el nombre."),
  email: z.string().trim().email("Ingresa un correo valido."),
  password: z.string().min(8, "La contrasena debe tener al menos 8 caracteres."),
  roleId: z.string().min(1, "Selecciona un rol."),
});

export const updateUserStatusSchema = z.object({
  userId: z.string().min(1),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export const updateSettingSchema = z.object({
  key: z.string().min(1),
  value: z.string().trim().min(1, "Ingresa un valor."),
});

