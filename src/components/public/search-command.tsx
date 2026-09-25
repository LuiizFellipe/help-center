"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Loader2, Search } from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";

type SearchResult = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  category: string;
};

export function SearchCommand({
  variant = "button",
}: {
  variant?: "button" | "hero";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((current) => !current);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(term)}`);
        setResults((await response.json()) as SearchResult[]);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  function goTo(slug: string) {
    setOpen(false);
    setQuery("");
    router.push(`/a/${slug}`);
  }

  return (
    <>
      {variant === "button" ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          className="gap-2 border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
        >
          <Search className="size-4" aria-hidden />
          <span className="hidden sm:inline">Pesquisar</span>
          <kbd className="pointer-events-none hidden rounded border border-white/25 bg-white/10 px-1.5 font-mono text-[10px] text-white/80 sm:inline">
            Ctrl K
          </kbd>
        </Button>
      ) : (
        <Button
          variant="outline"
          size="lg"
          onClick={() => setOpen(true)}
          className="h-12 w-full max-w-xl justify-start gap-2 rounded-full bg-card pl-5 text-left text-muted-foreground shadow-sm"
        >
          <Search className="size-5 shrink-0" aria-hidden />
          <span className="flex-1">Buscar por um assunto…</span>
          <kbd className="pointer-events-none rounded border bg-muted px-1.5 font-mono text-[10px]">
            Ctrl K
          </kbd>
        </Button>
      )}

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Pesquisar na ajuda"
        description="Digite para buscar artigos publicados"
      >
        {/* O <Command> raiz cria o store interno do cmdk — sem ele os
            subcomponentes quebram com "reading 'subscribe'" */}
        <Command>
          <CommandInput
            placeholder="Digite o que você procura…"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Buscando…
              </div>
            ) : query.trim().length >= 2 && results.length === 0 ? (
              <CommandEmpty>Nenhum artigo encontrado.</CommandEmpty>
            ) : results.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Digite pelo menos 2 caracteres para buscar.
              </div>
            ) : (
              <CommandGroup heading={`${results.length} resultado(s)`}>
                {results.map((result) => (
                  <CommandItem
                    key={result.id}
                    value={`${result.title} ${result.category}`}
                    onSelect={() => goTo(result.slug)}
                  >
                    <FileText className="text-primary" aria-hidden />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{result.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {result.category}
                      </p>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
          <div className="border-t px-3 py-2 text-xs text-muted-foreground">
            Não encontrou? Veja{" "}
            <Link
              href="/buscar"
              onClick={() => setOpen(false)}
              className="font-medium text-primary hover:underline"
            >
              todos os artigos
            </Link>{" "}
            ou navegue pelas categorias.
          </div>
        </Command>
      </CommandDialog>
    </>
  );
}
