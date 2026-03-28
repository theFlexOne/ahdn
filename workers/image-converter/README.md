# Image Converter Worker

This Cloud Run worker accepts uploaded raster images over HTTP and returns resized AVIF, WebP, and JPEG variants as base64-encoded JSON.

The runtime uses Deno for the HTTP server shape. The worker API is intentionally explicit: callers must provide the output `formats` and `widths` they want for each request.

## Run locally

From `workers/image-converter/`:

```bash
deno task dev
```

From the repo root:

```bash
npm run dev --prefix workers/image-converter
```

Optional local env values live in `.env.local`. See `.env.example` for the supported variables:

- `PORT` defaults to `8080`
- `WORKER_SHARED_SECRET` protects `POST /convert` when set
- `MAX_UPLOAD_BYTES` defaults to `20971520` (20 MiB per uploaded file)

If you want Deno to read `.env.local` directly for an ad hoc run, use:

```bash
deno run --env-file=.env.local --allow-scripts=npm:sharp --allow-env --allow-net --allow-read --allow-ffi src/main.ts
```

## Endpoints

### `GET /health`

Returns the legacy readiness payload used by the existing local tooling:

```json
{
  "ok": true
}
```

### `GET /healthz`

Returns a Cloud Run-style health response:

```json
{
  "ok": true,
  "service": "image-converter"
}
```

### `POST /convert`

Converts one or more uploaded images into the exact output formats and widths requested.

#### Request format

- `Content-Type: multipart/form-data`
- Optional header: `x-worker-secret: <WORKER_SHARED_SECRET>`
- Form fields:
  - `formats` repeatable text field, such as `avif`, `.webp`, or `jpeg`
  - `formats[0]`, `formats[1]`, ... are also accepted
  - `widths` repeatable text field containing positive integer pixel widths
  - `widths[0]`, `widths[1]`, ... are also accepted
  - `file[0]`, `file[1]`, ... required file fields
  - `file` is also accepted as shorthand for a single file

Notes:

- The worker does not apply default formats. Pass every output format you want.
- The worker does not apply preset widths. Pass every target width you want.
- Duplicate formats and widths are removed.
- The worker only emits widths less than or equal to the source image width.
- Images are never enlarged. If every requested width is larger than the source image, the worker falls back to the source width.
- Uploaded files must have an image MIME type when a type is provided.
- SVG uploads are rejected.

Multipart example:

```bash
curl -X POST http://127.0.0.1:8080/convert \
  -H "x-worker-secret: local-worker-shared-secret" \
  -F "formats=avif" \
  -F "formats=webp" \
  -F "formats=jpg" \
  -F "widths=240" \
  -F "widths=400" \
  -F "widths=640" \
  -F "file[0]=@./sample.png;type=image/png"
```

Multiple files example:

```bash
curl -X POST http://127.0.0.1:8080/convert \
  -H "x-worker-secret: local-worker-shared-secret" \
  -F "formats=.webp" \
  -F "formats=jpeg" \
  -F "widths=768" \
  -F "widths=1280" \
  -F "file[0]=@./cover.jpg;type=image/jpeg" \
  -F "file[1]=@./detail.png;type=image/png"
```

If `WORKER_SHARED_SECRET` is not configured, omit the `x-worker-secret` header.

#### Response format

Successful conversions return:

```ts
type ConvertResponse = {
  results: Array<{
    filenameBase: string;
    variants: Array<{
      mimeType: "image/avif" | "image/webp" | "image/jpeg";
      width: number;
      height: number;
      filename: string;
      contentBase64: string;
    }>;
  }>;
};
```

Response behavior:

- `results` stays in the same order as the uploaded files.
- Each result contains one entry per generated width and output format.
- `variants` are sorted by width, then MIME type.
- `contentBase64` is the encoded binary image payload for that variant.

## Error responses

Unauthorized requests return:

```json
{
  "error": "Unauthorized"
}
```

Validation failures return `400` with a single `error` message, for example:

```json
{
  "error": "Field \"formats\" must contain at least one supported format/extension"
}
```

```json
{
  "error": "Field \"widths\" must contain at least one positive integer"
}
```

Unexpected processing failures return `500`:

```json
{
  "error": "Failed to process uploaded images",
  "message": "Could not determine image width for \"broken.png\""
}
```

## Deployment Files

- `deno.json` configures local tasks and the Deno runtime.
- `Dockerfile` builds a Cloud Run-ready Deno container.
- `service.yaml` and `cloudbuild.yaml` mirror the new Cloud Run deployment style.
- `postman_collection.json` contains local requests for `/health` and `/convert`.
