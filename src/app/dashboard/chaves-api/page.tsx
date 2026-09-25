import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth-guard";
import { listApiKeys } from "@/lib/services/api-keys";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreateApiKeyDialog, RevokeApiKeyButton } from "./api-key-manager";

export const metadata: Metadata = {
  title: "Chaves de API (MCP)",
};

export default async function ApiKeysPage() {
  await requireAdmin();
  const keys = await listApiKeys();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Chaves de API (MCP)</h1>
          <p className="text-sm text-muted-foreground">
            Autenticam assistentes de IA no servidor MCP desta central.
          </p>
        </div>
        <CreateApiKeyDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{keys.length} chave(s)</CardTitle>
          <CardDescription>
            A chave completa é exibida apenas no momento da criação — aqui aparecem
            somente os primeiros caracteres.
          </CardDescription>
        </CardHeader>
        {keys.length === 0 ? (
          <div className="px-6 pb-10 text-center text-sm text-muted-foreground">
            Nenhuma chave criada. Gere uma para conectar o assistente de IA.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Chave</TableHead>
                <TableHead className="hidden sm:table-cell">Último uso</TableHead>
                <TableHead className="hidden md:table-cell">Criada em</TableHead>
                <TableHead className="w-14 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.map((key) => (
                <TableRow key={key.id}>
                  <TableCell className="font-medium">{key.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-mono">
                      {key.prefix}…
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {key.lastUsedAt
                      ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(key.lastUsedAt)
                      : "Nunca usada"}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(key.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <RevokeApiKeyButton id={key.id} name={key.name} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conectando um assistente</CardTitle>
          <CardDescription>
            Endpoint do MCP: <code className="rounded bg-muted px-1.5 py-0.5">POST /api/mcp</code>{" "}
            (Streamable HTTP) com header{" "}
            <code className="rounded bg-muted px-1.5 py-0.5">Authorization: Bearer &lt;sua-chave&gt;</code>.
            Veja o README para a configuração completa no ZCode, Claude ou Cursor.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
