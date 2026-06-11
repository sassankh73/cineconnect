import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { UPLOAD_LIMITS, type UploadKind } from "@/lib/constants";
import { validateFile } from "@/lib/validation";
import { uid } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

// Server-side enforcement of file size/type limits (defense in depth — the
// client also validates pre-upload). Saves to /public/uploads and returns URL.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const kind = url.searchParams.get("kind") as UploadKind | null;
  if (!kind || !(kind in UPLOAD_LIMITS)) {
    return NextResponse.json({ error: "invalid_kind" }, { status: 400 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "no_file" }, { status: 400 });
  }

  const check = validateFile(kind, { size: file.size, name: file.name, type: file.type });
  if (!check.ok) {
    return NextResponse.json(
      { error: check.reason === "size" ? "file_too_big" : "file_wrong_type", limit: UPLOAD_LIMITS[kind] },
      { status: 413 }
    );
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const filename = `${kind}_${uid()}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(dir, { recursive: true });
  const buf = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(dir, filename), buf);

  return NextResponse.json({ url: `/uploads/${filename}`, kind, size: file.size });
}
