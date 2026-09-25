import { revalidatePath } from "next/cache";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  createCategory,
  deleteCategory,
  getCategory,
  listCategories,
  updateCategory,
} from "@/lib/services/categories";
import {
  createArticle,
  deleteArticle,
  getArticleByIdOrSlug,
  listArticles,
  publishArticle,
  unpublishArticle,
  updateArticle,
} from "@/lib/services/articles";
import {
  imageRecordUrl,
  listImages,
  saveImageBuffer,
} from "@/lib/services/images";

function json(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function jsonError(error: string) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify({ error }, null, 2) }],
    isError: true,
  };
}

function revalidatePublic() {
  revalidatePath("/", "layout");
}

/**
 * Servidor MCP stateless — uma instância por requisição,
 * criada dentro do route handler /api/mcp.
 */
export function createHelpCenterMcpServer() {
  const server = new McpServer({
    name: "wcheck-help-center",
    version: "1.0.0",
  });

  // ── Categorias ──────────────────────────────────────────────

  server.registerTool(
    "list_categories",
    {
      title: "Listar categorias",
      description:
        "Lista todas as categorias da central de ajuda (ex.: ERP Veicular, Financeiro), com id, slug e contagem de artigos.",
      inputSchema: {},
    },
    async () => json(await listCategories())
  );

  server.registerTool(
    "create_category",
    {
      title: "Criar categoria",
      description: "Cria uma nova categoria de artigos.",
      inputSchema: {
        name: z.string().min(2).max(80).describe("Nome da categoria (ex.: ERP Veicular)"),
        icon: z
          .string()
          .optional()
          .describe("Nome do ícone lucide opcional (ex.: Truck, Wallet)"),
        order: z.number().int().optional().describe("Ordem de exibição (menor aparece primeiro)"),
      },
    },
    async ({ name, icon, order }) => {
      const result = await createCategory({ name, icon: icon ?? null, order });
      if (!result.ok) return jsonError(result.error);
      revalidatePublic();
      return json(result.data);
    }
  );

  server.registerTool(
    "update_category",
    {
      title: "Atualizar categoria",
      description: "Atualiza nome, ícone ou ordem de uma categoria existente.",
      inputSchema: {
        id: z.string().describe("Id da categoria (veja list_categories)"),
        name: z.string().min(2).max(80).optional(),
        icon: z.string().nullable().optional(),
        order: z.number().int().optional(),
      },
    },
    async ({ id, name, icon, order }) => {
      const existing = await getCategory(id);
      if (!existing) return jsonError("Categoria não encontrada");
      const result = await updateCategory(existing.id, {
        name: name ?? existing.name,
        icon: icon === undefined ? existing.icon : icon,
        order: order ?? existing.order,
      });
      if (!result.ok) return jsonError(result.error);
      revalidatePublic();
      return json(result.data);
    }
  );

  server.registerTool(
    "delete_category",
    {
      title: "Excluir categoria",
      description:
        "Exclui uma categoria. Falha se a categoria ainda tiver artigos.",
      inputSchema: { id: z.string().describe("Id da categoria") },
    },
    async ({ id }) => {
      const result = await deleteCategory(id);
      if (!result.ok) return jsonError(result.error);
      revalidatePublic();
      return json({ deleted: true });
    }
  );

  // ── Artigos ─────────────────────────────────────────────────

  server.registerTool(
    "list_articles",
    {
      title: "Listar artigos",
      description: "Lista artigos, opcionalmente filtrando por categoria ou status.",
      inputSchema: {
        category_id: z.string().optional().describe("Filtrar por id da categoria"),
        status: z.enum(["DRAFT", "PUBLISHED"]).optional().describe("Filtrar por status"),
      },
    },
    async ({ category_id, status }) => {
      const articles = await listArticles({ categoryId: category_id, status });
      return json(
        articles.map((article) => ({
          id: article.id,
          title: article.title,
          slug: article.slug,
          status: article.status,
          category: { id: article.category.id, name: article.category.name },
          updatedAt: article.updatedAt,
        }))
      );
    }
  );

  server.registerTool(
    "get_article",
    {
      title: "Obter artigo",
      description:
        "Retorna o artigo completo (conteúdo em HTML) por id ou slug.",
      inputSchema: {
        id_or_slug: z.string().describe("Id ou slug do artigo"),
      },
    },
    async ({ id_or_slug }) => {
      const article = await getArticleByIdOrSlug(id_or_slug);
      if (!article) return jsonError("Artigo não encontrado");
      return json(article);
    }
  );

  server.registerTool(
    "create_article",
    {
      title: "Criar artigo",
      description:
        "Cria um artigo de ajuda. O conteúdo deve ser HTML simples permitindo as tags p, h2, h3, ul, ol, li, strong, em, blockquote, a e img. Use h2 para as seções — elas alimentam o índice 'Nesta página'.",
      inputSchema: {
        category_id: z.string().describe("Id da categoria (veja list_categories)"),
        title: z.string().min(5).max(160).describe("Título do artigo"),
        excerpt: z.string().max(400).optional().describe("Resumo curto exibido sob o título"),
        content_html: z.string().min(1).describe("Conteúdo do artigo em HTML"),
        publish: z
          .boolean()
          .optional()
          .describe("true para publicar imediatamente; padrão: criar como rascunho"),
      },
    },
    async ({ category_id, title, excerpt, content_html, publish }) => {
      const result = await createArticle(
        {
          title,
          excerpt: excerpt ?? null,
          content: content_html,
          categoryId: category_id,
          status: publish ? "PUBLISHED" : "DRAFT",
        },
        undefined
      );
      if (!result.ok) return jsonError(result.error);
      revalidatePublic();
      return json({
        id: result.data.id,
        slug: result.data.slug,
        status: result.data.status,
        url: `/a/${result.data.slug}`,
      });
    }
  );

  server.registerTool(
    "update_article",
    {
      title: "Atualizar artigo",
      description:
        "Atualiza título, resumo, conteúdo (HTML), categoria e/ou status de um artigo existente.",
      inputSchema: {
        id: z.string().describe("Id do artigo"),
        title: z.string().min(5).max(160).optional(),
        excerpt: z.string().max(400).nullable().optional(),
        content_html: z.string().min(1).optional(),
        category_id: z.string().optional(),
        status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
      },
    },
    async ({ id, title, excerpt, content_html, category_id, status }) => {
      const existing = await getArticleByIdOrSlug(id);
      if (!existing) return jsonError("Artigo não encontrado");
      const result = await updateArticle(existing.id, {
        title: title ?? existing.title,
        slug: existing.slug,
        excerpt: excerpt === undefined ? existing.excerpt : excerpt,
        content: content_html ?? existing.content,
        categoryId: category_id ?? existing.categoryId,
        status: status ?? existing.status,
      });
      if (!result.ok) return jsonError(result.error);
      revalidatePublic();
      return json({
        id: result.data.id,
        slug: result.data.slug,
        status: result.data.status,
        url: `/a/${result.data.slug}`,
      });
    }
  );

  server.registerTool(
    "publish_article",
    {
      title: "Publicar artigo",
      description: "Torna um artigo visível na central de ajuda pública.",
      inputSchema: { id: z.string().describe("Id do artigo") },
    },
    async ({ id }) => {
      const result = await publishArticle(id);
      if (!result.ok) return jsonError(result.error);
      revalidatePublic();
      return json({ id: result.data.id, status: result.data.status });
    }
  );

  server.registerTool(
    "unpublish_article",
    {
      title: "Despublicar artigo",
      description: "Volta um artigo para rascunho (sai do ar na central).",
      inputSchema: { id: z.string().describe("Id do artigo") },
    },
    async ({ id }) => {
      const result = await unpublishArticle(id);
      if (!result.ok) return jsonError(result.error);
      revalidatePublic();
      return json({ id: result.data.id, status: result.data.status });
    }
  );

  server.registerTool(
    "delete_article",
    {
      title: "Excluir artigo",
      description: "Exclui definitivamente um artigo.",
      inputSchema: { id: z.string().describe("Id do artigo") },
    },
    async ({ id }) => {
      const result = await deleteArticle(id);
      if (!result.ok) return jsonError(result.error);
      revalidatePublic();
      return json({ deleted: true });
    }
  );

  // ── Imagens ─────────────────────────────────────────────────

  server.registerTool(
    "upload_image",
    {
      title: "Enviar imagem",
      description:
        "Envia uma imagem (base64) para a central de ajuda e retorna a URL pronta para usar no HTML dos artigos (tag img). Formatos: PNG, JPG, WEBP ou GIF até 5 MB.",
      inputSchema: {
        filename: z.string().describe("Nome do arquivo (ex.: captura-tela.png)"),
        mime_type: z
          .enum(["image/png", "image/jpeg", "image/webp", "image/gif"])
          .describe("Tipo MIME da imagem"),
        data_base64: z.string().describe("Conteúdo da imagem em base64 (sem o prefixo data:)"),
        alt: z.string().optional().describe("Texto alternativo para acessibilidade"),
      },
    },
    async ({ filename, mime_type, data_base64, alt }) => {
      const buffer = Buffer.from(data_base64, "base64");
      const result = await saveImageBuffer({
        filename,
        mimeType: mime_type,
        buffer,
        alt: alt ?? null,
      });
      if (!result.ok) return jsonError(result.error);
      return json({ ...result.data, absoluteUrlHint: "Use a url relativa dentro do HTML do artigo" });
    }
  );

  server.registerTool(
    "list_images",
    {
      title: "Listar imagens",
      description: "Lista as imagens já enviadas, com as URLs para usar nos artigos.",
      inputSchema: {},
    },
    async () =>
      json(
        (await listImages()).map((image) => ({
          id: image.id,
          filename: image.filename,
          url: imageRecordUrl(image),
          size: image.size,
          createdAt: image.createdAt,
        }))
      )
  );

  return server;
}
