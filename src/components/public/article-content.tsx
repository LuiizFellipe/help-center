"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

type ZoomedImage = { src: string; alt: string };

/**
 * Renderiza o HTML do artigo e abre um lightbox quando o leitor
 * clica em alguma imagem do conteúdo.
 */
export function ArticleContent({
  html,
  className,
}: {
  html: string;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoomed, setZoomed] = useState<ZoomedImage | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function handleClick(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (target.tagName !== "IMG") return;
      event.preventDefault();
      const img = target as HTMLImageElement;
      setZoomed({ src: img.currentSrc || img.src, alt: img.alt });
    }

    container.addEventListener("click", handleClick);
    return () => container.removeEventListener("click", handleClick);
  }, []);

  useEffect(() => {
    if (!zoomed) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setZoomed(null);
    }
    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [zoomed]);

  return (
    <>
      <div
        ref={containerRef}
        className={className}
        // HTML sanitizado na gravação do artigo (sanitize-html)
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {zoomed
        ? createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-label={zoomed.alt || "Imagem ampliada"}
              className="fixed inset-0 z-[100] flex animate-in fade-in-0 cursor-zoom-out items-center justify-center bg-black/80 p-4 duration-200 sm:p-10"
              onClick={() => setZoomed(null)}
            >
              <button
                type="button"
                onClick={() => setZoomed(null)}
                aria-label="Fechar imagem"
                className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/25"
                autoFocus
              >
                <X className="size-5" aria-hidden />
              </button>
              <figure
                className="flex max-h-full flex-col items-center gap-3 animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={zoomed.src}
                  alt={zoomed.alt}
                  className="max-h-[85vh] max-w-full rounded-lg bg-background object-contain shadow-2xl"
                />
                {zoomed.alt ? (
                  <figcaption className="max-w-full truncate text-sm text-white/80">
                    {zoomed.alt}
                  </figcaption>
                ) : null}
              </figure>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
