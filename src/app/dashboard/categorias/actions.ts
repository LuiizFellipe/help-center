"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-guard";
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/lib/services/categories";

export async function createCategoryAction(input: unknown) {
  await requireAdmin();
  const result = await createCategory(input);
  if (result.ok) revalidatePath("/dashboard/categorias");
  revalidatePath("/", "layout");
  return result;
}

export async function updateCategoryAction(id: string, input: unknown) {
  await requireAdmin();
  const result = await updateCategory(id, input);
  if (result.ok) revalidatePath("/dashboard/categorias");
  revalidatePath("/", "layout");
  return result;
}

export async function deleteCategoryAction(id: string) {
  await requireAdmin();
  const result = await deleteCategory(id);
  if (result.ok) revalidatePath("/dashboard/categorias");
  revalidatePath("/", "layout");
  return result;
}
