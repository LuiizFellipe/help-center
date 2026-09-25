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
import {
  createUserAction,
  updateUserAction,
} from "./actions";

export type UserRow = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "EDITOR";
  active: boolean;
};

export function UserFormDialog({
  user,
  trigger,
}: {
  user?: UserRow;
  trigger?: React.ReactNode;
}) {
  const router = useRouter();
  const isEdit = Boolean(user);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [role, setRole] = useState<"ADMIN" | "EDITOR">(user?.role ?? "EDITOR");
  const [active, setActive] = useState<"true" | "false">(user?.active === false ? "false" : "true");
  const [password, setPassword] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      if (!isEdit && password.length < 8) {
        toast.error("A senha precisa de pelo menos 8 caracteres.");
        return;
      }
      const result = isEdit
        ? await updateUserAction(user!.id, {
            name,
            email: email.trim().toLowerCase(),
            role,
            active: active === "true",
            ...(password ? { password } : {}),
          })
        : await createUserAction({
            name,
            email: email.trim().toLowerCase(),
            role,
            password,
          });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(
        isEdit ? "Usuário atualizado." : `Usuário criado com papel ${role === "ADMIN" ? "Administrador" : "Editor"}.`
      );
      setOpen(false);
      if (!isEdit) {
        setName("");
        setEmail("");
        setRole("EDITOR");
        setPassword("");
      }
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (isEdit ? (
          <Button variant="ghost" size="icon" aria-label={`Editar usuário ${user!.name}`}>
            <Pencil />
          </Button>
        ) : (
          <Button>
            <Plus aria-hidden />
            Novo usuário
          </Button>
        ))}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar usuário" : "Novo usuário"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Altere nome, e-mail, papel ou defina uma nova senha."
              : "O novo usuário já poderá acessar o painel com o e-mail e a senha definidos."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user-name">Nome</Label>
            <Input
              id="user-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome completo"
              required
              minLength={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="user-email">E-mail</Label>
            <Input
              id="user-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nome@wcheckbrasil.com.br"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Papel</Label>
              <Select value={role} onValueChange={(value) => setRole(value as "ADMIN" | "EDITOR")}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Administrador</SelectItem>
                  <SelectItem value="EDITOR">Editor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {isEdit ? (
              <div className="space-y-2">
                <Label>Situação</Label>
                <Select value={active} onValueChange={(value) => setActive(value as "true" | "false")}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Ativo</SelectItem>
                    <SelectItem value="false">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </div>
          {isEdit ? (
            <p className="text-xs text-muted-foreground">
              Papéis: Administrador gerencia tudo; Editor gerencia somente artigos e
              imagens.
            </p>
          ) : (
            <div className="space-y-2">
              <Label>Papel</Label>
              <Select value={role} onValueChange={(value) => setRole(value as "ADMIN" | "EDITOR")}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Administrador — gerencia tudo</SelectItem>
                  <SelectItem value="EDITOR">Editor — somente artigos e imagens</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="user-password">
              {isEdit ? "Nova senha (opcional)" : "Senha"}
            </Label>
            <Input
              id="user-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isEdit ? "Deixe vazio para manter a atual" : "Mínimo de 8 caracteres"}
              minLength={isEdit ? 0 : 8}
              required={!isEdit}
              autoComplete="new-password"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
              {isEdit ? "Salvar alterações" : "Criar usuário"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
