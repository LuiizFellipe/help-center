"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Copy, KeyRound, Loader2, Plus, Trash2 } from "lucide-react";
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
import { createApiKeyAction, revokeApiKeyAction } from "./actions";

export function CreateApiKeyDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [created, setCreated] = useState<{ key: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await createApiKeyAction(name);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setCreated({ key: result.data.key });
      router.refresh();
    });
  }

  function handleClose(next: boolean) {
    if (!next) {
      setCreated(null);
      setName("");
      setCopied(false);
    }
    setOpen(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button>
          <Plus aria-hidden />
          Gerar nova chave
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {created ? (
          <>
            <DialogHeader>
              <DialogTitle>Chave criada</DialogTitle>
              <DialogDescription>
                Copie a chave agora — ela não será exibida novamente.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center gap-2 rounded-md border bg-muted p-3">
              <code className="flex-1 overflow-x-auto text-xs">{created.key}</code>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={async () => {
                  await navigator.clipboard.writeText(created.key);
                  setCopied(true);
                  toast.success("Chave copiada.");
                }}
                aria-label="Copiar chave"
              >
                {copied ? <Check /> : <Copy />}
              </Button>
            </div>
            <DialogFooter>
              <Button onClick={() => handleClose(false)}>Concluído</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Gerar chave de API (MCP)</DialogTitle>
              <DialogDescription>
                A chave autentica o servidor MCP para criar conteúdo e enviar imagens
                via IA. Guarde-a em um local seguro.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-key-name">Nome da chave</Label>
                <Input
                  id="api-key-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex.: ZCode, Claude Desktop…"
                  required
                  minLength={3}
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={pending || name.trim().length < 3}>
                  {pending ? (
                    <Loader2 className="animate-spin" aria-hidden />
                  ) : (
                    <KeyRound aria-hidden />
                  )}
                  Gerar chave
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function RevokeApiKeyButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive"
          aria-label={`Revogar chave ${name}`}
        >
          <Trash2 />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Revogar chave &quot;{name}&quot;?</AlertDialogTitle>
          <AlertDialogDescription>
            O cliente que usa esta chave perderá o acesso ao MCP imediatamente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              startTransition(async () => {
                const result = await revokeApiKeyAction(id);
                if (!result.ok) {
                  toast.error(result.error);
                  return;
                }
                toast.success("Chave revogada.");
                router.refresh();
              });
            }}
            disabled={pending}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
            Revogar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
