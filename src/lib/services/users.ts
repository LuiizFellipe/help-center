import { hash } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { fail, ok, type ServiceResult } from "./categories";

export const createUserSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome").max(80),
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  role: z.enum(["ADMIN", "EDITOR"]),
  password: z.string().min(8, "A senha precisa de pelo menos 8 caracteres").max(72),
});

export const updateUserSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome").max(80).optional(),
  email: z.string().trim().toLowerCase().email("E-mail inválido").optional(),
  role: z.enum(["ADMIN", "EDITOR"]).optional(),
  active: z.boolean().optional(),
  password: z
    .string()
    .min(8, "A senha precisa de pelo menos 8 caracteres")
    .max(72)
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

type PublicUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "EDITOR";
  active: boolean;
  createdAt: Date;
};

const publicSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  active: true,
  createdAt: true,
} as const;

export async function listUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
    },
  });
}

export async function createUser(
  input: unknown
): Promise<ServiceResult<PublicUser>> {
  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Dados inválidos");
  }
  const data = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) return fail("Já existe um usuário com este e-mail");

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      role: data.role,
      passwordHash: await hash(data.password, 12),
    },
    select: publicSelect,
  });
  return ok(user);
}

export async function updateUser(
  id: string,
  input: unknown,
  actorId: string
): Promise<ServiceResult<PublicUser>> {
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return fail("Usuário não encontrado");

  const parsed = updateUserSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Dados inválidos");
  }
  const data = parsed.data;

  if (data.email && data.email !== target.email) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) return fail("Já existe um usuário com este e-mail");
  }

  // Proteção: não deixar o sistema sem nenhum admin ativo
  if (
    target.role === "ADMIN" &&
    (data.role === "EDITOR" || data.active === false)
  ) {
    const activeAdmins = await prisma.user.count({
      where: { role: "ADMIN", active: true, NOT: { id } },
    });
    if (activeAdmins === 0) {
      return fail("É necessário manter pelo menos um administrador ativo");
    }
  }

  if (id === actorId && data.active === false) {
    return fail("Você não pode desativar seu próprio usuário");
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      name: data.name ?? target.name,
      email: data.email ?? target.email,
      role: data.role ?? target.role,
      active: data.active ?? target.active,
      ...(data.password ? { passwordHash: await hash(data.password, 12) } : {}),
    },
    select: publicSelect,
  });
  return ok(user);
}

export async function setPassword(
  id: string,
  password: string,
  actorId: string
): Promise<ServiceResult<true>> {
  if (password.length < 8) {
    return fail("A senha precisa de pelo menos 8 caracteres");
  }
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return fail("Usuário não encontrado");
  void actorId;
  await prisma.user.update({
    where: { id },
    data: { passwordHash: await hash(password, 12) },
  });
  return ok(true);
}
