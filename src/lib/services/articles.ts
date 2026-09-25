import sanitizeHtml from "sanitize-html";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import { fail, ok, type ServiceResult } from "./categories";

export const articleContentSchema = z
  .string()
  .min(1, "O conteúdo do artigo não pode estar vazio")
  .max(500_000, "Conteúdo muito extenso");

export const articleInputSchema = z.object({
  title: z.string().trim().min(5, "Informe um título com pelo menos 5 caracteres").max(160),
  slug: z.string().trim().max(180).optional(),
  excerpt: z.string().trim().max(400).optional().nullable(),
  content: articleContentSchema,
  categoryId: z.string().min(1, "Selecione a categoria"),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
  order: z.number().int().min(0).max(9999).optional(),
});

export type ArticleInput = z.infer<typeof articleInputSchema>;

export function sanitizeArticleHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "p", "h1", "h2", "h3", "h4", "ul", "ol", "li", "blockquote", "strong",
      "em", "s", "u", "code", "pre", "br", "hr", "a", "img", "span", "div",
      "table", "thead", "tbody", "tr", "th", "td",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel", "title"],
      img: ["src", "alt", "title", "width", "height", "loading"],
      p: ["data-placeholder"],
      code: ["class"],
      pre: ["class"],
      span: ["class"],
      div: ["class"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowProtocolRelative: false,
  });
}

async function uniqueSlug(base: string, ignoreId?: string): Promise<string> {
  const slug = slugify(base) || "artigo";
  let candidate = slug;
  let n = 2;
  while (true) {
    const existing = await prisma.article.findUnique({ where: { slug: candidate } });
    if (!existing || existing.id === ignoreId) return candidate;
    candidate = `${slug}-${n++}`;
  }
}

const articleInclude = {
  category: { select: { id: true, name: true, slug: true } },
} as const;

export async function listArticles(filters?: {
  categoryId?: string;
  status?: "DRAFT" | "PUBLISHED";
  q?: string;
  take?: number;
}) {
  const where: Record<string, unknown> = {};
  if (filters?.categoryId) where.categoryId = filters.categoryId;
  if (filters?.status) where.status = filters.status;
  if (filters?.q) {
    where.OR = [
      { title: { contains: filters.q, mode: "insensitive" } },
      { excerpt: { contains: filters.q, mode: "insensitive" } },
    ];
  }

  return prisma.article.findMany({
    where,
    orderBy: [{ order: "asc" }, { updatedAt: "desc" }],
    include: articleInclude,
    take: filters?.take ?? 500,
  });
}

export async function getArticleByIdOrSlug(idOrSlug: string) {
  return prisma.article.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    include: articleInclude,
  });
}

export async function createArticle(
  input: unknown,
  authorId?: string
): Promise<ServiceResult<Awaited<ReturnType<typeof prisma.article.create>>>> {
  const parsed = articleInputSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Dados inválidos");
  }
  const data = parsed.data;

  const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
  if (!category) return fail("Categoria não encontrada");

  const slug = await uniqueSlug(data.slug || data.title);
  const conflict = await prisma.article.findUnique({ where: { slug } });
  if (conflict) return fail(`Já existe um artigo com o slug "${slug}"`);

  const published = data.status === "PUBLISHED";
  const article = await prisma.article.create({
    data: {
      title: data.title,
      slug,
      excerpt: data.excerpt || null,
      content: sanitizeArticleHtml(data.content),
      categoryId: data.categoryId,
      status: data.status ?? "DRAFT",
      order: data.order ?? 0,
      publishedAt: published ? new Date() : null,
      createdById: authorId ?? null,
    },
    include: articleInclude,
  });
  return ok(article);
}

export async function updateArticle(
  id: string,
  input: unknown
): Promise<ServiceResult<Awaited<ReturnType<typeof prisma.article.update>>>> {
  const existing = await prisma.article.findUnique({ where: { id } });
  if (!existing) return fail("Artigo não encontrado");

  const parsed = articleInputSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Dados inválidos");
  }
  const data = parsed.data;

  const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
  if (!category) return fail("Categoria não encontrada");

  const slug = await uniqueSlug(data.slug || data.title, id);
  const conflict = await prisma.article.findUnique({ where: { slug } });
  if (conflict && conflict.id !== id) {
    return fail(`Já existe outro artigo com o slug "${slug}"`);
  }

  const published = data.status === "PUBLISHED";
  const article = await prisma.article.update({
    where: { id },
    data: {
      title: data.title,
      slug,
      excerpt: data.excerpt || null,
      content: sanitizeArticleHtml(data.content),
      categoryId: data.categoryId,
      status: data.status ?? existing.status,
      order: data.order ?? existing.order,
      publishedAt:
        published && !existing.publishedAt ? new Date() : existing.publishedAt,
    },
    include: articleInclude,
  });
  return ok(article);
}

export async function publishArticle(id: string): Promise<ServiceResult<Awaited<ReturnType<typeof prisma.article.update>>>> {
  const existing = await prisma.article.findUnique({ where: { id } });
  if (!existing) return fail("Artigo não encontrado");
  const article = await prisma.article.update({
    where: { id },
    data: {
      status: "PUBLISHED",
      publishedAt: existing.publishedAt ?? new Date(),
    },
    include: articleInclude,
  });
  return ok(article);
}

export async function unpublishArticle(id: string): Promise<ServiceResult<Awaited<ReturnType<typeof prisma.article.update>>>> {
  const existing = await prisma.article.findUnique({ where: { id } });
  if (!existing) return fail("Artigo não encontrado");
  const article = await prisma.article.update({
    where: { id },
    data: { status: "DRAFT" },
    include: articleInclude,
  });
  return ok(article);
}

export async function deleteArticle(id: string): Promise<ServiceResult<true>> {
  const existing = await prisma.article.findUnique({ where: { id } });
  if (!existing) return fail("Artigo não encontrado");
  await prisma.article.delete({ where: { id } });
  return ok(true);
}

export async function searchArticles(q: string) {
  const term = q.trim();
  if (term.length < 2) return [];
  return prisma.article.findMany({
    where: {
      status: "PUBLISHED",
      OR: [
        { title: { contains: term, mode: "insensitive" } },
        { excerpt: { contains: term, mode: "insensitive" } },
        { content: { contains: term, mode: "insensitive" } },
      ],
    },
    orderBy: [{ order: "asc" }, { updatedAt: "desc" }],
    include: articleInclude,
    take: 30,
  });
}
