import { randomUUID } from "crypto";
import { mkdir, readFile, stat, writeFile } from "fs/promises";
import path from "path";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "@/lib/prisma";
import {
  getS3Bucket,
  getS3Client,
  getS3ObjectUrl,
  getS3PublicBaseUrl,
} from "@/lib/s3";
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

function extFor(mimeType: string): string {
  return ALLOWED_MIME[mimeType] ?? ".png";
}

/** URL pública de uma imagem, de acordo com o armazenamento. */
export function imageRecordUrl(image: {
  id: string;
  storage: "LOCAL" | "S3";
  isPublic: boolean;
  objectKey?: string | null;
}): string {
  if (
    image.storage === "S3" &&
    image.isPublic &&
    image.objectKey &&
    getS3PublicBaseUrl()
  ) {
    return getS3ObjectUrl(image.objectKey);
  }
  return `/api/files/${image.id}`;
}

async function putS3Object(key: string, buffer: Buffer, mimeType: string) {
  const client = getS3Client()!;
  const base = {
    Bucket: getS3Bucket()!,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
    CacheControl: "public, max-age=31536000, immutable",
  };
  try {
    // Bucket pode ter ACLs habilitadas — torna o objeto público direto
    await client.send(new PutObjectCommand({ ...base, ACL: "public-read" }));
  } catch {
    // ACLs desabilitadas (BucketOwnerEnforced) — o acesso público fica
    // definido pela policy do bucket; envia sem ACL
    await client.send(new PutObjectCommand(base));
  }
}

async function isPubliclyReadable(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
}

export async function saveImageBuffer(input: {
  filename: string;
  mimeType: string;
  buffer: Buffer;
  alt?: string | null;
}): Promise<ServiceResult<SavedImage>> {
  if (!ALLOWED_MIME[input.mimeType]) {
    return fail("Formato de imagem não suportado. Use PNG, JPG, WEBP ou GIF.");
  }
  if (input.buffer.length === 0) {
    return fail("Arquivo vazio");
  }
  if (input.buffer.length > MAX_SIZE) {
    return fail("Imagem maior que 5 MB");
  }

  const ext = extFor(input.mimeType);
  const client = getS3Client();

  // ── S3 (Contabo) ────────────────────────────────────────────
  if (client) {
    const key = `uploads/${randomUUID()}${ext}`;
    await putS3Object(key, input.buffer, input.mimeType);

    const publicUrl = getS3ObjectUrl(key);
    const isPublic = await isPubliclyReadable(publicUrl);

    const image = await prisma.image.create({
      data: {
        filename: input.filename.slice(0, 200),
        mimeType: input.mimeType,
        size: input.buffer.length,
        alt: input.alt ?? null,
        storage: "S3",
        objectKey: key,
        isPublic,
      },
    });

    return ok({
      id: image.id,
      filename: image.filename,
      mimeType: image.mimeType,
      size: image.size,
      alt: image.alt,
      // Bucket público: o artigo referencia a URL direta (cache no bucket).
      // Bucket privado: passa pela nossa rota, que busca o objeto no S3.
      url: isPublic ? publicUrl : `/api/files/${image.id}`,
    });
  }

  // ── Disco local (desenvolvimento sem S3) ────────────────────
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
      storage: "LOCAL",
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
  if (!image || image.storage !== "LOCAL") return null;

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

/** Busca o objeto no S3 para servir imagens privadas pela nossa rota. */
export async function getS3ImageBytes(
  objectKey: string
): Promise<{ buffer: Buffer; mimeType: string } | null> {
  const client = getS3Client();
  const bucket = getS3Bucket();
  if (!client || !bucket) return null;
  try {
    const result = await client.send(
      new GetObjectCommand({ Bucket: bucket, Key: objectKey })
    );
    if (!result.Body) return null;
    return {
      buffer: Buffer.from(await result.Body.transformToByteArray()),
      mimeType: result.ContentType ?? "application/octet-stream",
    };
  } catch {
    return null;
  }
}

function extOf(filename: string, mimeType: string): string {
  const fromName = path.extname(filename).toLowerCase();
  if (fromName && Object.values(ALLOWED_MIME).includes(fromName)) return fromName;
  return ALLOWED_MIME[mimeType] ?? ".png";
}

export async function listImages() {
  return prisma.image.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
}
