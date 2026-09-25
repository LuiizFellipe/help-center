/**
 * Cria uma chave de API para o servidor MCP sem passar pelo painel.
 *
 * Uso: npx tsx scripts/create-mcp-key.ts "Nome da chave"
 */
import { createHash, randomBytes } from "crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const name = process.argv[2];
  if (!name || name.trim().length < 3) {
    console.error("Uso: npx tsx scripts/create-mcp-key.ts \"Nome da chave\"");
    process.exit(1);
  }

  const raw = `wck_${randomBytes(24).toString("hex")}`;
  const created = await prisma.apiKey.create({
    data: {
      name: name.trim(),
      prefix: raw.slice(0, 12),
      keyHash: createHash("sha256").update(raw).digest("hex"),
    },
  });

  console.log(`Chave criada (id: ${created.id}). Guarde-a — não será exibida novamente:`);
  console.log(raw);
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
