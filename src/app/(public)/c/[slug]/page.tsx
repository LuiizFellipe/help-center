import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { CategoriesNav } from "@/components/public/categories-nav";
import { CategoryIcon } from "@/components/category-icon";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export const dynamic = "force-dynamic";

async function getCategory(slug: string) {
  return prisma.category.findUnique({
    where: { slug },
    include: {
      articles: {
        where: { status: "PUBLISHED" },
        orderBy: [{ order: "asc" }, { publishedAt: "desc" }],
        select: { id: true, title: true, slug: true, excerpt: true },
      },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) return { title: "Categoria não encontrada" };
  return {
    title: category.name,
    description: `Artigos de ajuda sobre ${category.name} na W Check Brasil.`,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) notFound();

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-8 lg:grid-cols-[240px_1fr]">
      <aside className="hidden lg:block">
        <div className="sticky top-24">
          <CategoriesNav activeSlug={category.slug} />
        </div>
      </aside>

      <article>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Todas as coleções</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{category.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <header className="mt-4 border-b pb-6">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10">
              <CategoryIcon name={category.icon} className="size-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {category.name}
            </h1>
          </div>
          <p className="mt-2 text-muted-foreground">
            {category.articles.length}{" "}
            {category.articles.length === 1
              ? "artigo disponível"
              : "artigos disponíveis"}{" "}
            nesta categoria.
          </p>
        </header>

        {category.articles.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Ainda não há artigos publicados nesta categoria.
          </p>
        ) : (
          <ul className="divide-y">
            {category.articles.map((article) => (
              <li key={article.id}>
                <Link
                  href={`/a/${article.slug}`}
                  className="group flex gap-3 py-4 transition-colors"
                >
                  <FileText className="mt-1 size-4 shrink-0 text-primary" aria-hidden />
                  <div>
                    <p className="font-medium group-hover:text-primary group-hover:underline">
                      {article.title}
                    </p>
                    {article.excerpt ? (
                      <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                        {article.excerpt}
                      </p>
                    ) : null}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </article>
    </div>
  );
}
