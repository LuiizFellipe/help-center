import Link from "next/link";
import Image from "next/image";
import { SearchCommand } from "@/components/public/search-command";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-brand-navy">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <Image
              src="/wcheck-logo.webp"
              alt="W Check Brasil"
              width={150}
              height={34}
              priority
              className="h-auto w-[130px]"
            />
            <span className="rounded bg-brand-blue px-2 py-0.5 text-[11px] font-bold uppercase tracking-widest text-white">
              Ajuda
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <SearchCommand variant="button" />
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-white/10 bg-brand-navy py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-center text-sm text-white/60 sm:flex-row sm:text-left">
          <p>
            Central de Ajuda — <span className="font-medium text-white/85">W Check Brasil</span>
          </p>
          <p>
            Plataforma de gestão veicular, consultas e documentos digitais ·{" "}
            <a
              href="https://wcheckbrasil.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/85 hover:text-white hover:underline"
            >
              wcheckbrasil.com.br
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
