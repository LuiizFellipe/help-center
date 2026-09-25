"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { deleteCategoryAction } from "./actions";

export function DeleteCategoryButton({
  id,
  name,
  articleCount,
}: {
  id: string;
  name: string;
  articleCount: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteCategoryAction(id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`Categoria "${name}" excluída.`);
      router.refresh();
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive"
          aria-label={`Excluir categoria ${name}`}
        >
          <Trash2 />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
          <AlertDialogDescription>
            {articleCount > 0
              ? `A categoria "${name}" possui ${articleCount} artigo(s). Exclua ou mova os artigos antes de removê-la.`
              : `A categoria "${name}" será removida permanentemente. Essa ação não pode ser desfeita.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={pending || articleCount > 0}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
