import { randomUUID } from "crypto";
import { mkdir, readFile, stat, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { fail, ok, type ServiceResult } from "./categories";

const ALLOWED_MIME: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export function uploadDir(): string {
  return process.env.UPLOAD_DIR ?? "./uploads";
}

export type SavedImage = {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  alt: string | null;
  url: string;
};

export async function saveImageBuffer(input: {
  filename: string;
  mimeType: string;
  buffer: Buffer;
  alt?: string | null;
}): Promise<ServiceResult<SavedImage>> {
  const ext = ALLOWED_MIME[input.mimeType];
  if (!ext) {
    return fail("Formato de imagem não suportado. Use PNG, JPG, WEBP ou GIF.");
  }
  if (input.buffer.length === 0) {
    return fail("Arquivo vazio");
  }
  if (input.buffer.length > MAX_SIZE) {
    return fail("Imagem maior que 5 MB");
  }

  const id = randomUUID();
  const dir = uploadDir();
  await mkdir(dir, { recursive: true });
  await writeFile(
    path.join(/* turbopackIgnore: true */ dir, `${id}${ext}`),
    input.buffer
  );

  const image = await prisma.image.create({
    data: {
      id,
      filename: input.filename.slice(0, 200),
      mimeType: input.mimeType,
      size: input.buffer.length,
      alt: input.alt ?? null,
    },
  });

  return ok({
    id: image.id,
    filename: image.filename,
    mimeType: image.mimeType,
    size: image.size,
    alt: image.alt,
    url: `/api/files/${image.id}`,
  });
}

export async function readImageFile(id: string) {
  const image = await prisma.image.findUnique({ where: { id } });
  if (!image) return null;

  const preferred = extOf(image.filename, image.mimeType);
  const candidates = [
    preferred,
    ...Object.values(ALLOWED_MIME).filter((ext) => ext !== preferred),
  ];

  for (const ext of candidates) {
    try {
      const filePath = path.join(
        /* turbopackIgnore: true */ uploadDir(),
        `${image.id}${ext}`
      );
      const info = await stat(filePath);
      if (!info.isFile()) continue;
      const buffer = await readFile(filePath);
      return { image, buffer, ext };
    } catch {
      continue;
    }
  }
  return null;
}

function extOf(filename: string, mimeType: string): string {
  const fromName = path.extname(filename).toLowerCase();
  if (fromName && Object.values(ALLOWED_MIME).includes(fromName)) return fromName;
  return ALLOWED_MIME[mimeType] ?? ".png";
}

export async function listImages() {
  return prisma.image.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
}
