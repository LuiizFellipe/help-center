import { redirect } from "next/navigation";
import { auth } from "@/auth";

export type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  role: "ADMIN" | "EDITOR";
};

/** Exige sessão válida; redireciona para /login caso contrário. Para uso em páginas e server actions. */
export async function requireSession(): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role,
  };
}

/** Exige sessão de ADMIN; redireciona para o dashboard caso contrário. */
export async function requireAdmin(): Promise<SessionUser> {
  const session = await requireSession();
  if (session.role !== "ADMIN") {
    redirect("/dashboard");
  }
  return session;
}

/** Retorna a sessão ou null — para uso em route handlers, sem redirect. */
export async function getSessionOrNull(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role,
  };
}
