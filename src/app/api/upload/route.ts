import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { uploadToS3 } from "@/lib/s3";
import { assertS3Configured } from "@/lib/env";
import { uploadLimiter } from "@/lib/rate-limit";
import crypto from "crypto";
import { extname } from "path";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

async function getClientIp(): Promise<string> {
  const headersList = await headers();
  return (
    headersList.get("x-vercel-forwarded-for") ??
    headersList.get("cf-connecting-ip") ??
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headersList.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = await getClientIp();
  const limit = uploadLimiter(ip);
  if (!limit.success) {
    return NextResponse.json(
      { error: "Too many uploads. Please wait and try again." },
      { status: 429 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("image") as File | null;

  if (!file || file.size === 0) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File too large. Maximum size is 5MB." },
      { status: 400 },
    );
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Invalid file type. Only JPG, PNG, WEBP, and GIF allowed." },
      { status: 400 },
    );
  }

  try {
    assertS3Configured();
    const uniqueName =
      crypto.randomUUID() + extname(file.name).toLowerCase();
    const url = await uploadToS3(`content/${uniqueName}`, file);
    return NextResponse.json({ url });
  } catch {
    return NextResponse.json(
      { error: "Upload failed. Please try again." },
      { status: 500 },
    );
  }
}
