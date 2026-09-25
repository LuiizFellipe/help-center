import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth-guard";
import { listUsers } from "@/lib/services/users";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserFormDialog, type UserRow } from "./user-form-dialog";

export const metadata: Metadata = {
  title: "Usuários",
};

export default async function UsersPage() {
  const admin = await requireAdmin();
  const users = await listUsers();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Usuários</h1>
          <p className="text-sm text-muted-foreground">
            Quem pode acessar o painel e gerenciar a central de ajuda.
          </p>
        </div>
        <UserFormDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{users.length} usuário(s)</CardTitle>
          <CardDescription>
            Administradores gerenciam usuários, categorias e chaves de API. Editores
            gerenciam apenas artigos e imagens.
          </CardDescription>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="hidden sm:table-cell">E-mail</TableHead>
              <TableHead>Papel</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead className="w-14 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const row: UserRow = {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                active: user.active,
              };
              return (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.name}
                    {user.id === admin.id ? (
                      <span className="ml-2 text-xs text-muted-foreground">(você)</span>
                    ) : null}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    {user.role === "ADMIN" ? (
                      <Badge>Administrador</Badge>
                    ) : (
                      <Badge variant="secondary">Editor</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.active ? (
                      <Badge variant="outline" className="border-emerald-300 text-emerald-700">
                        Ativo
                      </Badge>
                    ) : (
                      <Badge variant="destructive">Inativo</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <UserFormDialog user={row} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Como desativar um usuário?</CardTitle>
          <CardDescription>
            Edite o usuário e desmarque a situação para ativo. Usuários inativos não
            conseguem mais fazer login, mas o histórico de artigos é preservado. Para
            reativar, defina uma nova senha no mesmo formulário.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
