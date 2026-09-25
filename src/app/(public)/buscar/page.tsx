import type { Metadata } from "next";
import Link from "next/link";
import { FileText, SearchX } from "lucide-react";
import { searchArticles } from "@/lib/services/articles";
import { CategoriesNav } from "@/components/public/categories-nav";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Busca",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const term = (q ?? "").trim();
  const results = term ? await searchArticles(term) : [];

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-8 lg:grid-cols-[240px_1fr]">
      <aside className="hidden lg:block">
        <div className="sticky top-24">
          <CategoriesNav />
        </div>
      </aside>

      <section>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Todas as coleções</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbPage>Busca</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <h1 className="mt-4 text-2xl font-bold tracking-tight">
          {term ? (
            <>
              Resultados para <span className="text-primary">“{term}”</span>
            </>
          ) : (
            "Buscar na central de ajuda"
          )}
        </h1>

        <form action="/buscar" className="mt-5 flex max-w-xl gap-2">
          <input
            type="search"
            name="q"
            defaultValue={term}
            placeholder="Digite o que você procura…"
            className="h-11 w-full rounded-full border border-input bg-card px-5 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          />
          <button
            type="submit"
            className="h-11 shrink-0 rounded-full bg-primary px-5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
          >
            Buscar
          </button>
        </form>

        {term ? (
          results.length === 0 ? (
            <div className="mt-10 flex flex-col items-center gap-3 py-10 text-center text-muted-foreground">
              <SearchX className="size-10" aria-hidden />
              <p>
                Nenhum artigo encontrado para <strong>“{term}”</strong>.
              </p>
              <Link href="/" className="text-sm font-medium text-primary hover:underline">
                Ver todas as categorias
              </Link>
            </div>
          ) : (
            <>
              <p className="mt-6 text-sm text-muted-foreground">
                {results.length} {results.length === 1 ? "artigo encontrado" : "artigos encontrados"}
              </p>
              <ul className="mt-3 divide-y">
                {results.map((article) => (
                  <li key={article.id}>
                    <Link href={`/a/${article.slug}`} className="group flex gap-3 py-4">
                      <FileText className="mt-1 size-4 shrink-0 text-primary" aria-hidden />
                      <div>
                        <p className="font-medium group-hover:text-primary group-hover:underline">
                          {article.title}
                        </p>
                        <p className="text-xs text-muted-foreground">{article.category.name}</p>
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
            </>
          )
        ) : null}
      </section>
    </div>
  );
}
