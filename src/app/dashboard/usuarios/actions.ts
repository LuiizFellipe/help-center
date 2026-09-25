"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-guard";
import { createUser, updateUser } from "@/lib/services/users";

export async function createUserAction(input: unknown) {
  await requireAdmin();
  const result = await createUser(input);
  if (result.ok) revalidatePath("/dashboard/usuarios");
  return result;
}

export async function updateUserAction(id: string, input: unknown) {
  const admin = await requireAdmin();
  const result = await updateUser(id, input, admin.id);
  if (result.ok) revalidatePath("/dashboard/usuarios");
  return result;
}
