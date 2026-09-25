import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Entrar no painel",
};

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-brand-navy px-4 py-10">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3">
          <Image
            src="/wcheck-logo.webp"
            alt="W Check Brasil"
            width={183}
            height={41}
            priority
          />
          <span className="rounded-md bg-brand-blue px-2.5 py-0.5 text-xs font-bold tracking-widest text-white uppercase">
            Central de Ajuda
          </span>
        </div>

        <div className="rounded-xl bg-card p-6 shadow-lg sm:p-8">
          <div className="mb-6 space-y-1 text-center">
            <h1 className="text-xl font-semibold tracking-tight">
              Acessar o painel
            </h1>
            <p className="text-sm text-muted-foreground">
              Entre com suas credenciais para gerenciar os artigos de ajuda.
            </p>
          </div>
          <LoginForm />
        </div>

        <p className="text-center text-xs text-white/60">
          W Check Brasil © {new Date().getFullYear()} — Todos os direitos reservados
        </p>
      </div>
    </main>
  );
}
