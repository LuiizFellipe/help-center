import Link from "next/link";
import {
  Eye,
  FileText,
  FolderOpen,
  Plus,
  Send,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-guard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function DashboardPage() {
  const user = await requireSession();

  const [categoryCount, publishedCount, draftCount, imageCount, viewsAgg, recent] =
    await Promise.all([
      prisma.category.count(),
      prisma.article.count({ where: { status: "PUBLISHED" } }),
      prisma.article.count({ where: { status: "DRAFT" } }),
      prisma.image.count(),
      prisma.article.aggregate({ _sum: { views: true } }),
      prisma.article.findMany({
        orderBy: { updatedAt: "desc" },
        take: 8,
        include: { category: { select: { name: true } } },
      }),
    ]);

  const stats = [
    { title: "Categorias", value: categoryCount, icon: FolderOpen },
    { title: "Artigos publicados", value: publishedCount, icon: Send },
    { title: "Rascunhos", value: draftCount, icon: FileText },
    { title: "Visualizações", value: viewsAgg._sum.views ?? 0, icon: Eye },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Olá, {user.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            Resumo da central de ajuda da W Check Brasil.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/artigos/novo">
            <Plus aria-hidden />
            Novo artigo
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1.5">
                <stat.icon className="size-4 text-primary" aria-hidden />
                {stat.title}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Artigos atualizados recentemente</CardTitle>
          <CardDescription>
            Últimos artigos criados ou editados no painel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhum artigo cadastrado ainda.{" "}
              <Link
                href="/dashboard/artigos/novo"
                className="font-medium text-primary hover:underline"
              >
                Criar o primeiro artigo
              </Link>
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead className="hidden sm:table-cell">Categoria</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Atualizado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map((article) => (
                  <TableRow key={article.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/artigos/${article.id}`}
                        className="font-medium hover:text-primary hover:underline"
                      >
                        {article.title}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {article.category.name}
                    </TableCell>
                    <TableCell>
                      {article.status === "PUBLISHED" ? (
                        <Badge>Publicado</Badge>
                      ) : (
                        <Badge variant="secondary">Rascunho</Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {new Intl.DateTimeFormat("pt-BR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      }).format(article.updatedAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
