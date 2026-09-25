import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Eye } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { extractToc } from "@/lib/toc";
import { ArticleContent } from "@/components/public/article-content";
import { CategoriesNav } from "@/components/public/categories-nav";
import { TableOfContents } from "@/components/public/toc";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export const dynamic = "force-dynamic";

async function getArticle(slug: string) {
  return prisma.article.findUnique({
    where: { slug },
    include: {
      category: { select: { id: true, name: true, slug: true } },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return { title: "Artigo não encontrado" };
  return {
    title: article.title,
    description: article.excerpt ?? undefined,
    openGraph: {
      title: article.title,
      description: article.excerpt ?? undefined,
      type: "article",
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article || article.status !== "PUBLISHED") {
    notFound();
  }

  await prisma.article.update({
    where: { id: article.id },
    data: { views: { increment: 1 } },
  });

  const { html, headings } = extractToc(article.content);

  const dateFormat = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" });

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-8 lg:grid-cols-[240px_1fr_210px]">
      <aside className="hidden lg:block">
        <div className="sticky top-24">
          <CategoriesNav activeSlug={article.category.slug} />
        </div>
      </aside>

      <article className="min-w-0">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Todas as coleções</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={`/c/${article.category.slug}`}>{article.category.name}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="max-w-[180px] truncate sm:max-w-none">
                {article.title}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          {article.title}
        </h1>
        {article.excerpt ? (
          <p className="mt-3 text-lg text-muted-foreground">{article.excerpt}</p>
        ) : null}

        <div className="mt-4 flex items-center gap-4 border-b pb-6 text-sm text-muted-foreground">
          <time dateTime={article.updatedAt.toISOString()}>
            {dateFormat.format(article.updatedAt)}
          </time>
          <span className="flex items-center gap-1.5">
            <Eye className="size-4" aria-hidden />
            {article.views + 1} visualizações
          </span>
        </div>

        <ArticleContent className="article-content mt-6" html={html} />
      </article>

      <aside className="hidden xl:block">
        <div className="sticky top-24">
          <TableOfContents headings={headings} />
        </div>
      </aside>
    </div>
  );
}
