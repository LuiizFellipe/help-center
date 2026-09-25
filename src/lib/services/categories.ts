import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export function fail(error: string): { ok: false; error: string } {
  return { ok: false, error };
}

export function ok<T>(data: T): { ok: true; data: T } {
  return { ok: true, data };
}

export const categoryInputSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da categoria").max(80),
  slug: z.string().trim().max(100).optional(),
  icon: z.string().trim().max(50).optional().nullable(),
  order: z.number().int().min(0).max(9999).optional(),
});

export type CategoryInput = z.infer<typeof categoryInputSchema>;

async function uniqueSlug(base: string, ignoreId?: string): Promise<string> {
  const slug = slugify(base) || "categoria";
  let candidate = slug;
  let n = 2;
  while (true) {
    const existing = await prisma.category.findUnique({ where: { slug: candidate } });
    if (!existing || existing.id === ignoreId) return candidate;
    candidate = `${slug}-${n++}`;
  }
}

export async function listCategories() {
  return prisma.category.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { articles: true } },
    },
  });
}

export async function getCategory(idOrSlug: string) {
  return prisma.category.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    include: {
      _count: { select: { articles: true } },
    },
  });
}

export async function createCategory(
  input: unknown
): Promise<ServiceResult<Awaited<ReturnType<typeof prisma.category.create>>>> {
  const parsed = categoryInputSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Dados inválidos");
  }
  const data = parsed.data;
  const slug = data.slug ? slugify(data.slug) : await uniqueSlug(data.name);
  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing) {
    return fail(`Já existe uma categoria com o slug "${slug}"`);
  }
  const category = await prisma.category.create({
    data: {
      name: data.name,
      slug,
      icon: data.icon || null,
      order: data.order ?? 0,
    },
  });
  return ok(category);
}

export async function updateCategory(
  id: string,
  input: unknown
): Promise<ServiceResult<Awaited<ReturnType<typeof prisma.category.update>>>> {
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) return fail("Categoria não encontrada");

  const parsed = categoryInputSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Dados inválidos");
  }
  const data = parsed.data;
  const slug = data.slug
    ? slugify(data.slug)
    : data.name === existing.name
      ? existing.slug
      : await uniqueSlug(data.name, id);
  const conflict = await prisma.category.findUnique({ where: { slug } });
  if (conflict && conflict.id !== id) {
    return fail(`Já existe outra categoria com o slug "${slug}"`);
  }
  const category = await prisma.category.update({
    where: { id },
    data: {
      name: data.name,
      slug,
      icon: data.icon || null,
      order: data.order ?? existing.order,
    },
  });
  return ok(category);
}

export async function deleteCategory(id: string): Promise<ServiceResult<true>> {
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) return fail("Categoria não encontrada");
  const articleCount = await prisma.article.count({ where: { categoryId: id } });
  if (articleCount > 0) {
    return fail(
      `A categoria possui ${articleCount} artigo(s). Exclua ou mova os artigos antes.`
    );
  }
  await prisma.category.delete({ where: { id } });
  return ok(true);
}
