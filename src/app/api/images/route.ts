import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSessionOrNull } from "@/lib/auth-guard";
import { imageRecordUrl, listImages, saveImageBuffer } from "@/lib/services/images";

export async function POST(request: NextRequest) {
  const session = await getSessionOrNull();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const alt = formData.get("alt");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Envie o campo 'file'" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await saveImageBuffer({
    filename: file.name || "imagem",
    mimeType: file.type,
    buffer,
    alt: typeof alt === "string" && alt.trim() ? alt.trim() : null,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  revalidatePath("/dashboard/artigos");
  return NextResponse.json(result.data, { status: 201 });
}

export async function GET() {
  const session = await getSessionOrNull();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  const images = await listImages();
  return NextResponse.json(
    images.map((image) => ({ ...image, url: imageRecordUrl(image) }))
  );
}
