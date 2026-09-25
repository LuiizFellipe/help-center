import { NextRequest, NextResponse } from "next/server";
import {
  getS3ImageBytes,
  readImageFile,
} from "@/lib/services/images";
import { getS3ObjectUrl, getS3PublicBaseUrl } from "@/lib/s3";
import { prisma } from "@/lib/prisma";

const IMMUTABLE_CACHE = "public, max-age=31536000, immutable";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const image = await prisma.image.findUnique({ where: { id } });
  if (!image) {
    return NextResponse.json({ error: "Imagem não encontrada" }, { status: 404 });
  }

  // S3 público: redireciona para a URL direta do bucket (cache no storage)
  if (image.storage === "S3") {
    if (image.isPublic && image.objectKey && getS3PublicBaseUrl()) {
      return NextResponse.redirect(getS3ObjectUrl(image.objectKey), 302);
    }
    // S3 privado: proxy dos bytes pela nossa API
    const bytes = image.objectKey ? await getS3ImageBytes(image.objectKey) : null;
    if (!bytes) {
      return NextResponse.json(
        { error: "Imagem não encontrada" },
        { status: 404 }
      );
    }
    return new NextResponse(new Uint8Array(bytes.buffer), {
      headers: {
        "Content-Type": bytes.mimeType,
        "Content-Length": String(bytes.buffer.length),
        "Cache-Control": IMMUTABLE_CACHE,
      },
    });
  }

  // Armazenamento local (desenvolvimento / deploy sem S3)
  const file = await readImageFile(id);
  if (!file) {
    return NextResponse.json({ error: "Imagem não encontrada" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(file.buffer), {
    headers: {
      "Content-Type": file.image.mimeType,
      "Content-Length": String(file.buffer.length),
      "Cache-Control": IMMUTABLE_CACHE,
    },
  });
}
