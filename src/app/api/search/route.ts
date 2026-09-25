import { NextRequest, NextResponse } from "next/server";
import { searchArticles } from "@/lib/services/articles";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  const results = await searchArticles(q);
  return NextResponse.json(
    results.map((article) => ({
      id: article.id,
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      category: article.category.name,
    }))
  );
}
