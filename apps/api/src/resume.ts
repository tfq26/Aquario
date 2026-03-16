import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import mammoth from "mammoth";
import pdfParse from "pdf-parse";
import type { R2BucketBinding } from "./bindings.js";
import type { ResumeAsset } from "./types.js";

const uploadsDir = path.resolve(process.cwd(), "uploads");

function buildStorageKey(fileName: string) {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
  return `resumes/${Date.now()}-${safeName}`;
}

export async function persistResume(file: File, bucket?: R2BucketBinding): Promise<ResumeAsset> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const storageKey = buildStorageKey(file.name);

  if (bucket) {
    await bucket.put(storageKey, buffer);
  } else {
    await mkdir(uploadsDir, { recursive: true });
    const outputPath = path.join(uploadsDir, file.name);
    await writeFile(outputPath, buffer);
  }

  let extractedText = "";

  if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
    const parsed = await pdfParse(buffer);
    extractedText = parsed.text;
  } else if (
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.name.endsWith(".docx")
  ) {
    const parsed = await mammoth.extractRawText({ buffer });
    extractedText = parsed.value;
  } else {
    extractedText = buffer.toString("utf8");
  }

  return {
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    uploadedAt: new Date().toISOString(),
    extractedText,
    storageKey
  };
}
