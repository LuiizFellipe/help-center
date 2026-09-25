import { NextRequest, NextResponse } from "next/server";
import { readImageFile } from "@/lib/services/images";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const file = await readImageFile(id);
  if (!file) {
    return NextResponse.json({ error: "Imagem não encontrada" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(file.buffer), {
    headers: {
      "Content-Type": file.image.mimeType,
      "Content-Length": String(file.buffer.length),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
