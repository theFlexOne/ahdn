import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const FUNCTION_URL = "http://127.0.0.1:54321/functions/v1/upload-image-files";
const AUTH_HEADER =
  "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

async function uploadImagesFromPath() {
  const inputPath = process.argv[2];
  const preset = process.argv[3] ?? "hero";

  if (!inputPath) {
    throw new Error("A file or directory path is required.");
  }

  const resolvedPath = path.resolve(inputPath);
  const stats = await fs.stat(resolvedPath).catch(() => null);
  if (!stats) {
    throw new Error(`Path does not exist: ${resolvedPath}`);
  }

  const filePaths = stats.isDirectory()
    ? (await fs.readdir(resolvedPath, { withFileTypes: true }))
      .filter((entry) => entry.isFile())
      .map((entry) => path.join(resolvedPath, entry.name))
    : stats.isFile()
    ? [resolvedPath]
    : [];

  if (filePaths.length === 0) {
    throw new Error(`No files found to upload at ${resolvedPath}`);
  }

  const images = await Promise.all(
    filePaths.map(async (filePath) =>
      (await fs.readFile(filePath)).toString("base64")
    ),
  );

  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      Authorization: AUTH_HEADER,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ preset, images }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  console.log(await response.text());
}

uploadImagesFromPath().catch((error) => {
  console.error(error);
  process.exit(1);
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/upload-image-files' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"preset":"hero","images":["<base64-image-1>","<base64-image-2>"]}'

*/
