import { NextRequest, NextResponse } from "next/server";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { validateApiKey } from "@/lib/services/api-keys";
import { createHelpCenterMcpServer } from "@/lib/mcp/server";

export const dynamic = "force-dynamic";

/**
 * Servidor MCP da central de ajuda (Streamable HTTP, modo stateless).
 * Autenticação: header `Authorization: Bearer <chave de API>` gerada em
 * /dashboard/chaves-api.
 */
export async function POST(request: NextRequest) {
  const authorized = await validateApiKey(request.headers.get("authorization"));
  if (!authorized) {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        error: { code: -32001, message: "Unauthorized: API key inválida ou ausente" },
        id: null,
      },
      { status: 401, headers: { "WWW-Authenticate": "Bearer" } }
    );
  }

  // Stateless: servidor + transporte por requisição
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  const server = createHelpCenterMcpServer();

  try {
    await server.connect(transport);
    return await transport.handleRequest(request);
  } catch (error) {
    console.error("[mcp] erro ao processar requisição:", error);
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        error: { code: -32700, message: "Erro interno do servidor MCP" },
        id: null,
      },
      { status: 500 }
    );
  } finally {
    await transport.close().catch(() => {});
    await server.close().catch(() => {});
  }
}

// Em modo stateless não há stream de servidor (GET) nem sessão para encerrar (DELETE).
export async function GET() {
  return NextResponse.json(
    { error: "Method Not Allowed — use POST /api/mcp com JSON-RPC" },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
