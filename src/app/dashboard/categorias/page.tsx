import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { requireAdmin } from "@/lib/auth-guard";
import { listCategories } from "@/lib/services/categories";
import { Badge } from "@/components/ui/badge";
import {
  Card,
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
import { Button } from "@/components/ui/button";
import { CategoryIcon } from "@/components/category-icon";
import {
  CategoryFormDialog,
  type CategoryRow,
} from "./category-form-dialog";
import { DeleteCategoryButton } from "./delete-category-button";

export const metadata: Metadata = {
  title: "Categorias",
};

export default async function CategoriesPage() {
  await requireAdmin();
  const categories = await listCategories();

  const rows: CategoryRow[] = categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    icon: category.icon,
    order: category.order,
    articleCount: category._count.articles,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Categorias</h1>
          <p className="text-sm text-muted-foreground">
            Organize os artigos por módulo ou assunto (ex.: ERP Veicular, Financeiro).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/" target="_blank">
              <ExternalLink aria-hidden />
              Ver central
            </Link>
          </Button>
          <CategoryFormDialog />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{categories.length} categoria(s)</CardTitle>
          <CardDescription>
            A ordem define a posição na página inicial da central de ajuda.
          </CardDescription>
        </CardHeader>
        {rows.length === 0 ? (
          <div className="px-6 pb-8 text-center text-sm text-muted-foreground">
            Nenhuma categoria criada ainda. Clique em{" "}
            <span className="font-medium text-foreground">Nova categoria</span> para
            começar.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoria</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Artigos</TableHead>
                <TableHead>Ordem</TableHead>
                <TableHead className="w-24 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <span className="flex items-center gap-2 font-medium">
                      <CategoryIcon
                        name={category.icon}
                        className="size-4 text-primary"
                      />
                      {category.name}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    /c/{category.slug}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{category.articleCount}</Badge>
                  </TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {category.order}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <CategoryFormDialog category={category} />
                      <DeleteCategoryButton
                        id={category.id}
                        name={category.name}
                        articleCount={category.articleCount}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
