"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { TocHeading } from "@/lib/toc";
import { cn } from "@/lib/utils";

export function TableOfContents({ headings }: { headings: TocHeading[] }) {
  const [activeId, setActiveId] = useState<string | null>(
    headings[0]?.id ?? null
  );
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current?.disconnect();
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 }
    );

    for (const heading of headings) {
      const element = document.getElementById(heading.id);
      if (element) observer.observe(element);
    }
    observerRef.current = observer;

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav aria-label="Nesta página" className="text-sm">
      <p className="mb-2 font-semibold text-foreground">Nesta página</p>
      <ul className="space-y-1 border-l">
        {headings.map((heading) => (
          <li key={heading.id}>
            <Link
              href={`#${heading.id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(heading.id)?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
                setActiveId(heading.id);
              }}
              className={cn(
                "-ml-px block border-l-2 py-0.5 pl-3 leading-snug transition-colors",
                heading.level === 3 && "pl-6",
                activeId === heading.id
                  ? "border-primary font-medium text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {heading.text}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
