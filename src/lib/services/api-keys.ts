import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { fail, ok, type ServiceResult } from "./categories";

export function hashApiKey(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export async function listApiKeys() {
  return prisma.apiKey.findMany({ orderBy: { createdAt: "desc" } });
}

export type CreatedApiKey = {
  id: string;
  name: string;
  key: string; // exibida apenas uma vez
};

export async function createApiKey(name: string): Promise<ServiceResult<CreatedApiKey>> {
  const trimmed = name.trim();
  if (trimmed.length < 3) return fail("Informe um nome para a chave (mín. 3 caracteres)");

  const raw = `wck_${randomBytes(24).toString("hex")}`;
  const created = await prisma.apiKey.create({
    data: {
      name: trimmed,
      prefix: raw.slice(0, 12),
      keyHash: hashApiKey(raw),
    },
  });

  return ok({ id: created.id, name: created.name, key: raw });
}

export async function revokeApiKey(id: string): Promise<ServiceResult<true>> {
  const existing = await prisma.apiKey.findUnique({ where: { id } });
  if (!existing) return fail("Chave não encontrada");
  await prisma.apiKey.delete({ where: { id } });
  return ok(true);
}

export async function validateApiKey(raw: string | null): Promise<boolean> {
  if (!raw) return false;
  const normalized = raw.replace(/^Bearer\s+/i, "").trim();
  if (!normalized) return false;
  const record = await prisma.apiKey.findUnique({
    where: { keyHash: hashApiKey(normalized) },
  });
  if (!record || !record.active) return false;
  await prisma.apiKey.update({
    where: { id: record.id },
    data: { lastUsedAt: new Date() },
  });
  return true;
}
