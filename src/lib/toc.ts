import { slugify } from "./slug";

export type TocHeading = {
  id: string;
  text: string;
  level: 2 | 3;
};

/**
 * Extrai os h2/h3 do HTML do artigo e injeta ids nas tags,
 * para alimentar o índice "Nesta página" com âncoras.
 */
export function extractToc(html: string): {
  html: string;
  headings: TocHeading[];
} {
  const headings: TocHeading[] = [];
  const usedIds = new Set<string>();

  const withIds = html.replace(
    /<h([23])>([\s\S]*?)<\/h\1>/g,
    (_match, levelRaw: string, inner: string) => {
      const level = Number(levelRaw) as 2 | 3;
      const text = inner.replace(/<[^>]+>/g, "").trim();
      let id = slugify(text) || "secao";
      let n = 2;
      while (usedIds.has(id)) id = `${slugify(text)}-${n++}`;
      usedIds.add(id);
      headings.push({ id, text, level });
      return `<h${level} id="${id}">${inner}</h${level}>`;
    }
  );

  return { html: withIds, headings };
}
