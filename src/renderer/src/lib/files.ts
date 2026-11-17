/** Browser-native file helpers. These work inside Electron without any extra IPC. */

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Opens the OS file picker and resolves with the chosen file (or null if cancelled). */
export function pickFile(accept: string): Promise<File | null> {
  return new Promise(resolve => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.onchange = () => resolve(input.files?.[0] ?? null);
    input.oncancel = () => resolve(null);
    input.click();
  });
}

const MAX_SOURCE_BYTES = 25 * 1024 * 1024;

/**
 * Downscales an image so it fits within maxWidth×maxHeight and re-encodes it as JPEG.
 * Keeps wallpapers small enough to store in local settings (a few hundred KB).
 */
export async function imageFileToDataUrl(file: File, maxWidth = 2560, maxHeight = 1440, quality = 0.85): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");
  if (file.size > MAX_SOURCE_BYTES) throw new Error("That image is too large (max 25 MB).");
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error("That image couldn't be read.");
  });
  const scale = Math.min(1, maxWidth / bitmap.width, maxHeight / bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Image processing isn't available.");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", quality);
}
