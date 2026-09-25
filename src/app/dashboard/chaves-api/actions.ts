"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-guard";
import { createApiKey, revokeApiKey } from "@/lib/services/api-keys";

export async function createApiKeyAction(name: string) {
  await requireAdmin();
  const result = await createApiKey(name);
  if (result.ok) revalidatePath("/dashboard/chaves-api");
  return result;
}

export async function revokeApiKeyAction(id: string) {
  await requireAdmin();
  const result = await revokeApiKey(id);
  if (result.ok) revalidatePath("/dashboard/chaves-api");
  return result;
}
