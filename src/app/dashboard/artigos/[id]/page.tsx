import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-guard";
import { ArticleEditor } from "@/components/dashboard/article-editor";

export const metadata: Metadata = {
  title: "Editar artigo",
};

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSession();
  const { id } = await params;

  const [article, categories] = await Promise.all([
    prisma.article.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        categoryId: true,
        status: true,
        views: true,
      },
    }),
    prisma.category.findMany({
      orderBy: [{ order: "asc" }, { name: "asc" }],
      select: { id: true, name: true },
    }),
  ]);

  if (!article) notFound();

  return <ArticleEditor categories={categories} article={article} />;
}
