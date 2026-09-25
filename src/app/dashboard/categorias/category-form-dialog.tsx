"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORY_ICONS, CategoryIcon } from "@/components/category-icon";
import {
  createCategoryAction,
  updateCategoryAction,
} from "./actions";

export type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  order: number;
  articleCount: number;
};

export function CategoryFormDialog({
  category,
  trigger,
}: {
  category?: CategoryRow;
  trigger?: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(category?.name ?? "");
  const [icon, setIcon] = useState(category?.icon ?? "none");
  const [order, setOrder] = useState(String(category?.order ?? 0));

  const isEdit = Boolean(category);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = isEdit
        ? await updateCategoryAction(category!.id, {
            name,
            icon: icon === "none" ? null : icon,
            order: Number(order) || 0,
          })
        : await createCategoryAction({
            name,
            icon: icon === "none" ? null : icon,
            order: Number(order) || 0,
          });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(isEdit ? "Categoria atualizada." : "Categoria criada.");
      setOpen(false);
      if (!isEdit) {
        setName("");
        setIcon("none");
        setOrder("0");
      }
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (isEdit ? (
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Editar categoria ${category!.name}`}
          >
            <Pencil />
          </Button>
        ) : (
          <Button>
            <Plus aria-hidden />
            Nova categoria
          </Button>
        ))}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar categoria" : "Nova categoria"}
          </DialogTitle>
          <DialogDescription>
            Categorias organizam os artigos na central de ajuda (ex.: ERP Veicular,
            Financeiro).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category-name">Nome</Label>
            <Input
              id="category-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: ERP Veicular"
              required
              minLength={2}
              maxLength={80}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ícone</Label>
              <Select value={icon} onValueChange={setIcon}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-muted-foreground">Sem ícone</span>
                  </SelectItem>
                  {CATEGORY_ICONS.map((item) => (
                    <SelectItem key={item.name} value={item.name}>
                      <span className="flex items-center gap-2">
                        <CategoryIcon name={item.name} className="size-4" />
                        {item.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-order">Ordem de exibição</Label>
              <Input
                id="category-order"
                type="number"
                min={0}
                max={9999}
                value={order}
                onChange={(e) => setOrder(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={pending || name.trim().length < 2}>
              {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Pencil aria-hidden />}
              {isEdit ? "Salvar alterações" : "Criar categoria"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
