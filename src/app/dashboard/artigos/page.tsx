import type { Metadata } from "next";
import Link from "next/link";
import { Eye, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-guard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = {
  title: "Artigos",
};

type SearchParams = Promise<{ q?: string; categoria?: string; status?: string }>;

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireSession();
  const params = await searchParams;

  const where: Record<string, unknown> = {};
  if (params.categoria) where.categoryId = params.categoria;
  if (params.status === "publicado" || params.status === "rascunho") {
    where.status = params.status === "publicado" ? "PUBLISHED" : "DRAFT";
  }
  if (params.q) {
    where.OR = [{ title: { contains: params.q, mode: "insensitive" } }];
  }

  const [articles, categories] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
      include: { category: { select: { id: true, name: true } } },
    }),
    prisma.category.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }] }),
  ]);

  function filterUrl(overrides: Record<string, string | undefined>) {
    const next = new URLSearchParams();
    const merged = { q: params.q, categoria: params.categoria, status: params.status, ...overrides };
    for (const [key, value] of Object.entries(merged)) {
      if (value) next.set(key, value);
    }
    const query = next.toString();
    return `/dashboard/artigos${query ? `?${query}` : ""}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Artigos</h1>
          <p className="text-sm text-muted-foreground">
            Crie, edite e publique os tutoriais da central de ajuda.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/artigos/novo">
            <Plus aria-hidden />
            Novo artigo
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>{articles.length} artigo(s)</CardTitle>
              <CardDescription>Filtre por busca, categoria ou status.</CardDescription>
            </div>
            <form action="/dashboard/artigos" className="flex max-w-md flex-1 gap-2">
              {params.categoria ? (
                <input type="hidden" name="categoria" value={params.categoria} />
              ) : null}
              {params.status ? (
                <input type="hidden" name="status" value={params.status} />
              ) : null}
              <Input
                name="q"
                defaultValue={params.q ?? ""}
                placeholder="Buscar por título…"
                className="h-9"
              />
              <Button type="submit" variant="outline" size="sm" className="h-9">
                Buscar
              </Button>
            </form>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusFilterChip
              label="Todos"
              href={filterUrl({ status: undefined })}
              active={!params.status}
            />
            <StatusFilterChip
              label="Publicados"
              href={filterUrl({ status: "publicado" })}
              active={params.status === "publicado"}
            />
            <StatusFilterChip
              label="Rascunhos"
              href={filterUrl({ status: "rascunho" })}
              active={params.status === "rascunho"}
            />
            <span className="mx-1 h-4 w-px bg-border" aria-hidden />
            {categories.length > 0 ? (
              <>
                <StatusFilterChip
                  label="Todas as categorias"
                  href={filterUrl({ categoria: undefined })}
                  active={!params.categoria}
                />
                {categories.map((category) => (
                  <StatusFilterChip
                    key={category.id}
                    label={category.name}
                    href={filterUrl({ categoria: category.id })}
                    active={params.categoria === category.id}
                  />
                ))}
              </>
            ) : null}
          </div>
        </CardHeader>

        {articles.length === 0 ? (
          <div className="px-6 pb-10 text-center text-sm text-muted-foreground">
            Nenhum artigo encontrado com os filtros atuais.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="px-6 py-3 font-medium">Título</th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">Categoria</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">Views</th>
                  <th className="px-6 py-3 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {articles.map((article) => (
                  <tr key={article.id} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="max-w-xs px-6 py-3">
                      <Link
                        href={`/dashboard/artigos/${article.id}`}
                        className="font-medium hover:text-primary hover:underline"
                      >
                        {article.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        /a/{article.slug}
                      </p>
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                      {article.category.name}
                    </td>
                    <td className="px-4 py-3">
                      {article.status === "PUBLISHED" ? (
                        <Badge>Publicado</Badge>
                      ) : (
                        <Badge variant="secondary">Rascunho</Badge>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                      <span className="flex items-center gap-1 text-xs">
                        <Eye className="size-3.5" aria-hidden />
                        {article.views}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/dashboard/artigos/${article.id}`}>Editar</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function StatusFilterChip({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? "border-primary bg-primary text-white"
          : "bg-background text-muted-foreground hover:bg-muted"
      }`}
    >
      {label}
    </Link>
  );
}
