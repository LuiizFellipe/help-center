import type { Metadata } from "next";
import Link from "next/link";
import { FolderOpen, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-guard";
import { Button } from "@/components/ui/button";
import { ArticleEditor } from "@/components/dashboard/article-editor";

export const metadata: Metadata = {
  title: "Novo artigo",
};

export default async function NewArticlePage() {
  await requireSession();
  const categories = await prisma.category.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
    select: { id: true, name: true },
  });

  if (categories.length === 0) {
    return (
      <div className="mx-auto max-w-md rounded-xl border bg-card p-8 text-center">
        <FolderOpen className="mx-auto size-10 text-primary" aria-hidden />
        <h1 className="mt-3 text-lg font-semibold">Crie uma categoria primeiro</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Todo artigo precisa pertencer a uma categoria (ex.: ERP Veicular,
          Financeiro).
        </p>
        <Button asChild className="mt-5">
          <Link href="/dashboard/categorias">
            <Plus aria-hidden />
            Ir para categorias
          </Link>
        </Button>
      </div>
    );
  }

  return <ArticleEditor categories={categories} />;
}
