import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { CategoryIcon } from "@/components/category-icon";
import { cn } from "@/lib/utils";

export async function CategoriesNav({
  activeSlug,
}: {
  activeSlug?: string;
}) {
  const categories = await prisma.category.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
    include: {
      articles: { where: { status: "PUBLISHED" }, select: { id: true } },
    },
  });

  const visible = categories.filter((category) => category.articles.length > 0);
  if (visible.length === 0) return null;

  return (
    <nav aria-label="Categorias da ajuda" className="text-sm">
      <ul className="space-y-0.5">
        <li>
          <Link
            href="/"
            className="flex items-center justify-between rounded-md px-3 py-2 font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            Todas as coleções
          </Link>
        </li>
        {visible.map((category) => (
          <li key={category.id}>
            <Link
              href={`/c/${category.slug}`}
              className={cn(
                "flex items-center justify-between gap-2 rounded-md px-3 py-2 transition-colors",
                category.slug === activeSlug
                  ? "bg-primary/10 font-semibold text-primary"
                  : "text-foreground/80 hover:bg-accent hover:text-foreground"
              )}
            >
              <span className="flex min-w-0 items-center gap-2">
                <CategoryIcon name={category.icon} className="size-4 shrink-0" />
                <span className="truncate">{category.name}</span>
              </span>
              <ChevronRight className="size-3.5 shrink-0 opacity-50" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
