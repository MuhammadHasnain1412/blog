import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

let _client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!_client) {
    _client = new S3Client({
      region: process.env.AWS_S3_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }
  return _client;
}

/**
 * Uploads a File to S3 and returns the public URL.
 * The bucket must have public read access (or a bucket policy allowing it).
 */
export async function uploadToS3(key: string, file: File): Promise<string> {
  const client = getS3Client();
  const bucket = process.env.AWS_S3_BUCKET_NAME!;
  const region = process.env.AWS_S3_REGION!;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: file.type,
      // Remove this line if your bucket uses a bucket policy for public access
      // instead of per-object ACLs
      // ACL: "public-read",
    }),
  );

  // Standard S3 public URL format
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}
