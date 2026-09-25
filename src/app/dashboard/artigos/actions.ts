"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth-guard";
import {
  createArticle,
  deleteArticle,
  publishArticle,
  unpublishArticle,
  updateArticle,
} from "@/lib/services/articles";

function revalidateAll() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/artigos");
  revalidatePath("/", "layout");
}

export async function saveArticleAction(input: {
  id?: string;
  title: string;
  slug?: string;
  excerpt?: string | null;
  content: string;
  categoryId: string;
  status: "DRAFT" | "PUBLISHED";
}) {
  const user = await requireSession();
  const result = input.id
    ? await updateArticle(input.id, input)
    : await createArticle(input, user.id);

  if (result.ok) revalidateAll();
  return result;
}

export async function setArticleStatusAction(
  id: string,
  status: "DRAFT" | "PUBLISHED"
) {
  await requireSession();
  const result =
    status === "PUBLISHED" ? await publishArticle(id) : await unpublishArticle(id);
  if (result.ok) revalidateAll();
  return result;
}

export async function deleteArticleAction(id: string) {
  await requireSession();
  const result = await deleteArticle(id);
  if (result.ok) revalidateAll();
  return result;
}
