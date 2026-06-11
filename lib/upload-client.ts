import { UPLOAD_LIMITS, type UploadKind } from "./constants";
import { validateFile } from "./validation";

// Client-side pre-upload check (size + type) BEFORE hitting the network.
export function precheck(kind: UploadKind, file: File) {
  return validateFile(kind, { size: file.size, name: file.name, type: file.type });
}

export function humanLimit(kind: UploadKind) {
  return `${UPLOAD_LIMITS[kind].max_mb}MB · ${UPLOAD_LIMITS[kind].formats.join(", ")}`;
}

// Uploads to the server (which re-validates). Returns the stored URL.
export async function uploadFile(kind: UploadKind, file: File): Promise<string> {
  const pre = precheck(kind, file);
  if (!pre.ok) throw new Error(pre.reason);
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`/api/upload?kind=${kind}`, { method: "POST", body: fd });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "upload_failed");
  }
  const data = await res.json();
  return data.url as string;
}
