import { S3Client } from "@aws-sdk/client-s3";

/**
 * Cliente S3 (Contabo Object Storage, compatível com a API da AWS).
 * Retorna null quando as variáveis S3_* não estão configuradas —
 * nesse caso os uploads caem no armazenamento local em disco.
 */
export function getS3Client(): S3Client | null {
  const endpoint = process.env.S3_ENDPOINT;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  if (!endpoint || !process.env.S3_BUCKET || !accessKeyId || !secretAccessKey) {
    return null;
  }
  return new S3Client({
    endpoint,
    region: process.env.S3_REGION ?? "us-east-1",
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export function getS3Bucket(): string | null {
  return process.env.S3_BUCKET ?? null;
}

/** Base das URLs públicas do bucket (ex.: https://usc1.contabostorage.com/ajuda). */
export function getS3PublicBaseUrl(): string | null {
  if (process.env.S3_PUBLIC_URL) return process.env.S3_PUBLIC_URL;
  const endpoint = process.env.S3_ENDPOINT;
  const bucket = process.env.S3_BUCKET;
  return endpoint && bucket ? `${endpoint}/${bucket}` : null;
}

export function getS3ObjectUrl(key: string): string {
  return `${getS3PublicBaseUrl()}/${key}`;
}
