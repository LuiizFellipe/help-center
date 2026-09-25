import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Eye } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { SearchCommand } from "@/components/public/search-command";
import { CategoryIcon } from "@/components/category-icon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Central de Ajuda — W Check Brasil",
};

export default async function HomePage() {
  const [categories, popular] = await Promise.all([
    prisma.category.findMany({
      orderBy: [{ order: "asc" }, { name: "asc" }],
      include: {
        articles: { where: { status: "PUBLISHED" }, select: { id: true } },
      },
    }),
    prisma.article.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ views: "desc" }, { publishedAt: "desc" }],
      take: 5,
      include: { category: { select: { name: true } } },
    }),
  ]);

  return (
    <div>
      <section className="bg-brand-navy pb-16 pt-14 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Olá! Como podemos ajudar?
          </h1>
          <p className="mt-3 text-white/70">
            Tutoriais e guias para você aproveitar ao máximo a plataforma W Check
            Brasil: ERP veicular, consultas, documentos digitais e financeiro.
          </p>
          <div className="mt-8 flex justify-center">
            <SearchCommand variant="hero" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-xl font-semibold tracking-tight">
          Categorias
        </h2>
        <p className="text-sm text-muted-foreground">
          Escolha um módulo para ver os artigos de ajuda.
        </p>

        {categories.length === 0 ? (
          <p className="mt-8 rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
            Nenhuma categoria publicada ainda.
          </p>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Link key={category.id} href={`/c/${category.slug}`} className="group">
                <Card className="h-full transition-all group-hover:-translate-y-0.5 group-hover:border-primary/40 group-hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                      <CategoryIcon name={category.icon} className="size-5 text-primary" />
                    </div>
                    <CardTitle className="mt-3 text-base">{category.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                      {category.articles.length}{" "}
                      {category.articles.length === 1 ? "artigo" : "artigos"}
                    </span>
                    <ArrowRight
                      className="size-4 transition-transform group-hover:translate-x-1 group-hover:text-primary"
                      aria-hidden
                    />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {popular.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 pb-16">
          <h2 className="text-xl font-semibold tracking-tight">Mais acessados</h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {popular.map((article) => (
              <li key={article.id}>
                <Link
                  href={`/a/${article.slug}`}
                  className="flex items-center justify-between gap-4 rounded-lg border bg-card px-4 py-3 transition-colors hover:border-primary/40 hover:bg-accent/40"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{article.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {article.category.name}
                    </p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                    <Eye className="size-3.5" aria-hidden />
                    {article.views}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
