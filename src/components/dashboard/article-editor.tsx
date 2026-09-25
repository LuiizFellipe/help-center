"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  ExternalLink,
  Eye,
  Loader2,
  Send,
  Save,
  Trash2,
} from "lucide-react";
import { slugify } from "@/lib/slug";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RichTextEditor } from "@/components/dashboard/rich-text-editor";
import {
  deleteArticleAction,
  saveArticleAction,
} from "@/app/dashboard/artigos/actions";

export type EditorCategory = { id: string; name: string };

export type EditorArticle = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  categoryId: string;
  status: "DRAFT" | "PUBLISHED";
  views: number;
};

export function ArticleEditor({
  categories,
  article,
}: {
  categories: EditorCategory[];
  article?: EditorArticle;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(article?.title ?? "");
  const [slug, setSlug] = useState(article?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(article));
  const [excerpt, setExcerpt] = useState(article?.excerpt ?? "");
  const [categoryId, setCategoryId] = useState(article?.categoryId ?? "");
  const [content, setContent] = useState(article?.content ?? "");
  const [pending, startTransition] = useTransition();
  const [deleting, startDelete] = useTransition();
  const lastSavedRef = useRef<string | null>(null);

  const isPublished = article?.status === "PUBLISHED";

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  function save(status: "DRAFT" | "PUBLISHED") {
    startTransition(async () => {
      if (title.trim().length < 5) {
        toast.error("O título precisa de pelo menos 5 caracteres.");
        return;
      }
      if (!categoryId) {
        toast.error("Selecione a categoria do artigo.");
        return;
      }
      if (!content.trim() || content === "<p></p>") {
        toast.error("Escreva o conteúdo do artigo.");
        return;
      }

      const result = await saveArticleAction({
        id: article?.id,
        title: title.trim(),
        slug: slug.trim() || undefined,
        excerpt: excerpt.trim() || null,
        content,
        categoryId,
        status,
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      lastSavedRef.current = result.data.id;
      toast.success(
        status === "PUBLISHED"
          ? "Artigo publicado na central de ajuda."
          : "Rascunho salvo."
      );

      if (!article) {
        router.push(`/dashboard/artigos/${result.data.id}`);
      } else {
        router.refresh();
      }
    });
  }

  function handleDelete() {
    if (!article) return;
    if (!window.confirm(`Excluir definitivamente o artigo "${article.title}"?`)) {
      return;
    }
    startDelete(async () => {
      const result = await deleteArticleAction(article.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Artigo excluído.");
      router.push("/dashboard/artigos");
      router.refresh();
    });
  }

  const currentSlug = slug || slugify(title);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" aria-label="Voltar">
            <Link href="/dashboard/artigos">
              <ArrowLeft />
            </Link>
          </Button>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              {article ? "Editar artigo" : "Novo artigo"}
            </h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {article ? (
                <>
                  <Badge variant={isPublished ? "default" : "secondary"}>
                    {isPublished ? "Publicado" : "Rascunho"}
                  </Badge>
                  <span className="flex items-center gap-1">
                    <Eye className="size-3" aria-hidden />
                    {article.views} visualizações
                  </span>
                </>
              ) : (
                <span>Preencha os campos e salve como rascunho ou publique</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {article && isPublished ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`/a/${article.slug}`} target="_blank">
                <ExternalLink aria-hidden />
                Ver na central
              </Link>
            </Button>
          ) : null}
          {article ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              className="text-destructive hover:text-destructive"
            >
              {deleting ? (
                <Loader2 className="animate-spin" aria-hidden />
              ) : (
                <Trash2 aria-hidden />
              )}
              Excluir
            </Button>
          ) : null}
          <Button
            variant="outline"
            onClick={() => save("DRAFT")}
            disabled={pending}
          >
            <Save aria-hidden />
            Salvar rascunho
          </Button>
          <Button onClick={() => save("PUBLISHED")} disabled={pending}>
            {pending ? (
              <Loader2 className="animate-spin" aria-hidden />
            ) : (
              <Send aria-hidden />
            )}
            Publicar
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_260px]">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="article-title">Título</Label>
            <Input
              id="article-title"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Ex.: Como cadastrar um veículo no sistema"
              className="text-base font-medium"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="article-content">Conteúdo</Label>
            <RichTextEditor
              content={content}
              onChange={setContent}
              placeholder="Escreva o passo a passo do artigo. Use H2 para as seções — elas viram o índice 'Nesta página'."
            />
            <p className="text-xs text-muted-foreground">
              Arraste, cole ou use o botão de imagem para enviar capturas de tela.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione…" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="article-slug">URL (slug)</Label>
            <Input
              id="article-slug"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              placeholder="gerado a partir do título"
            />
            <p className="text-xs break-all text-muted-foreground">
              /a/{currentSlug || "…"}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="article-excerpt">Resumo</Label>
            <textarea
              id="article-excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Aparece abaixo do título e nos resultados de busca (máx. 400 caracteres)."
              maxLength={400}
              rows={5}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
