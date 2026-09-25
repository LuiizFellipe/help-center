# Central de Ajuda — W Check Brasil

Help center (estilo Intercom/Yampi) para os produtos W Check Brasil: **central pública** de artigos de ajuda, **painel administrativo** para gestão de conteúdo e usuários, e **servidor MCP** para criar conteúdo e enviar imagens via assistentes de IA.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- shadcn/ui + Tailwind CSS v4 (tema na identidade W Check: azul `#5569ff` + navy `#0e365e`)
- Prisma 6 + PostgreSQL 17 (container Docker próprio, porta **5433**)
- Auth.js (next-auth v5, credenciais + JWT, papéis ADMIN/EDITOR)
- Tiptap (editor WYSIWYG com upload/colagem/arrastar imagens)
- MCP Streamable HTTP (`/api/mcp`) autenticado por chave de API

## Como rodar

```bash
# 1. Banco de dados (container exclusivo deste projeto, porta 5433)
docker compose up -d

# 2. Dependências
npm install

# 3. Configure o ambiente (já existe um .env de exemplo)
cp .env.example .env   # ajuste AUTH_SECRET e senhas se quiser

# 4. Schema do banco + dados iniciais
npx prisma migrate dev
npx prisma db seed

# 5. Desenvolvimento
npm run dev
```

Acessos:

| URL | Descrição |
|---|---|
| http://localhost:3100 | Central de ajuda (pública) |
| http://localhost:3000/login | Painel administrativo |
| http://localhost:3000/dashboard | Painel (após login) |

**Usuários iniciais (seed):**

| Papel | E-mail | Senha |
|---|---|---|
| Administrador | `admin@wcheckbrasil.com.br` | `Wcheck@2026` |
| Editor | `editor@wcheckbrasil.com.br` | `Editor@2026` |

> Altere essas senhas em produção (Painel → Usuários).

## Papéis

- **Administrador**: gerencia usuários, categorias, chaves de API e artigos.
- **Editor**: cria/edita artigos e envia imagens (não gerencia usuários, categorias nem chaves).

## Servidor MCP

Endpoint: `POST /api/mcp` (Streamable HTTP, modo stateless, resposta JSON).
Autenticação: `Authorization: Bearer <chave>` — gere a chave em **Painel → Chaves de API (MCP)**. A chave completa é exibida uma única vez.

### Ferramentas disponíveis

- **Categorias**: `list_categories`, `create_category`, `update_category`, `delete_category`
- **Artigos**: `list_articles`, `get_article`, `create_article`, `update_article`, `publish_article`, `unpublish_article`, `delete_article`
- **Imagens**: `upload_image` (base64 → URL `/api/files/<id>`), `list_images`

O conteúdo dos artigos é HTML simples (`p`, `h2`, `h3`, `ul/ol/li`, `strong`, `em`, `blockquote`, `a`, `img`). Use `h2` para seções — elas viram o índice “Nesta página” no artigo.

### Configurar no ZCode

`.zcode/mcp.json` (ou configuração global):

```json
{
  "mcpServers": {
    "wcheck-help-center": {
      "type": "http",
      "url": "http://localhost:3000/api/mcp",
      "headers": {
        "Authorization": "Bearer wck_SUA_CHAVE_AQUI"
      }
    }
  }
}
```

### Configurar no Claude Desktop / Cursor

```json
{
  "mcpServers": {
    "wcheck-help-center": {
      "url": "http://localhost:3000/api/mcp",
      "transport": "http",
      "headers": {
        "Authorization": "Bearer wck_SUA_CHAVE_AQUI"
      }
    }
  }
}
```

### Exemplo de uso (curl)

```bash
# Handshake
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer wck_SUA_CHAVE" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"curl","version":"1.0"}}}'

# Listar ferramentas
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer wck_SUA_CHAVE" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}'
```

## Armazenamento de imagens

As imagens ficam em disco (pasta `uploads/`, definida por `UPLOAD_DIR`) com metadados no Postgres e são servidas por `/api/files/<id>` com cache imutável. Formatos aceitos: PNG, JPG, WEBP, GIF (até 5 MB).

## Scripts úteis

```bash
npm run dev            # desenvolvimento
npm run build && npm start  # produção
npm run lint           # ESLint
npx prisma studio      # inspect do banco
docker compose up -d   # sobe o Postgres (5433)
docker compose down    # para o container (os dados persistem no volume)
```
- Padrão de porta: 3100 (a 3000 costuma estar ocupada por outro projeto W Check).
