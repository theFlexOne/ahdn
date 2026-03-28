# Image Converter Worker

This worker accepts uploaded raster images over HTTP and returns resized AVIF, WebP, and JPEG variants as base64-encoded JSON.

## Run locally

```bash
npm run dev
```

Optional local env values live in `.env.local`. See `.env.example` for the supported variables:

- `PORT` defaults to `8080`
- `WORKER_SHARED_SECRET` protects `POST /convert` when set
- `MAX_UPLOAD_BYTES` defaults to `20971520` (20 MiB per uploaded file)

## Endpoints

### `GET /health`

Returns a simple readiness response:

```json
{
  "ok": true
}
```

### `POST /convert`

Converts one or more uploaded images into multiple responsive variants.

#### Request format

- `Content-Type: multipart/form-data`
- Optional header: `x-worker-secret: <WORKER_SHARED_SECRET>`
- Form fields:
  - `preset` optional text field
  - `file[0]`, `file[1]`, ... required file fields
  - `file` is also accepted as shorthand for a single file

Supported `preset` values:

| Preset | Target widths |
| --- | --- |
| `thumbnail` | `240`, `400`, `640` |
| `content` | `600`, `900`, `1440` |
| `hero` | `768`, `1280`, `1920` |

Notes:

- If `preset` is omitted, the worker uses `content`.
- The worker only emits widths less than or equal to the source image width.
- Images are never enlarged.
- Uploaded files must have an image MIME type.
- SVG uploads are rejected.

Logical request shape:

```ts
type ConvertRequest = {
  preset?: 'thumbnail' | 'content' | 'hero';
  files: File[];
};
```

Multipart example:

```bash
curl -X POST http://127.0.0.1:8080/convert \
  -H "x-worker-secret: local-worker-shared-secret" \
  -F "preset=thumbnail" \
  -F "file[0]=@./sample.png;type=image/png"
```

Multiple files example:

```bash
curl -X POST http://127.0.0.1:8080/convert \
  -H "x-worker-secret: local-worker-shared-secret" \
  -F "preset=content" \
  -F "file[0]=@./cover.jpg;type=image/jpeg" \
  -F "file[1]=@./detail.png;type=image/png"
```

If `WORKER_SHARED_SECRET` is not configured, omit the `x-worker-secret` header.

#### Response format

The response always returns JSON. Successful conversions look like this:

```ts
type ConvertResponse = {
  results: Array<{
    filenameBase: string;
    variants: Array<{
      mimeType: 'image/avif' | 'image/webp' | 'image/jpeg';
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

Example success response for one uploaded `sample.png` file using the `thumbnail` preset:

```json
{
  "results": [
    {
      "filenameBase": "sample",
      "variants": [
        {
          "mimeType": "image/avif",
          "width": 240,
          "height": 135,
          "filename": "sample-240.avif",
          "contentBase64": "AAAAIGZ0eXBhdmlm..."
        },
        {
          "mimeType": "image/jpeg",
          "width": 240,
          "height": 135,
          "filename": "sample-240.jpg",
          "contentBase64": "/9j/4AAQSkZJRgABAQ..."
        },
        {
          "mimeType": "image/webp",
          "width": 240,
          "height": 135,
          "filename": "sample-240.webp",
          "contentBase64": "UklGRl4AAABXRUJQV..."
        },
        {
          "mimeType": "image/avif",
          "width": 400,
          "height": 225,
          "filename": "sample-400.avif",
          "contentBase64": "AAAAIGZ0eXBhdmlm..."
        },
        {
          "mimeType": "image/jpeg",
          "width": 400,
          "height": 225,
          "filename": "sample-400.jpg",
          "contentBase64": "/9j/4AAQSkZJRgABAQ..."
        },
        {
          "mimeType": "image/webp",
          "width": 400,
          "height": 225,
          "filename": "sample-400.webp",
          "contentBase64": "UklGRmAAAABXRUJQV..."
        },
        {
          "mimeType": "image/avif",
          "width": 640,
          "height": 360,
          "filename": "sample-640.avif",
          "contentBase64": "AAAAIGZ0eXBhdmlm..."
        },
        {
          "mimeType": "image/jpeg",
          "width": 640,
          "height": 360,
          "filename": "sample-640.jpg",
          "contentBase64": "/9j/4AAQSkZJRgABAQ..."
        },
        {
          "mimeType": "image/webp",
          "width": 640,
          "height": 360,
          "filename": "sample-640.webp",
          "contentBase64": "UklGRoAAAABXRUJQV..."
        }
      ]
    }
  ]
}
```

The base64 strings above are intentionally truncated for readability.

## Error responses

Unauthorized request when `WORKER_SHARED_SECRET` is configured and the header is missing or wrong:

```json
{
  "error": "Unauthorized"
}
```

Validation errors return `400` with a single `error` message:

```json
{
  "error": "Field \"preset\" must be one of: thumbnail, content, hero"
}
```

```json
{
  "error": "Body must include at least one image file"
}
```

Unexpected processing failures return `500`:

```json
{
  "error": "Failed to process uploaded images",
  "message": "Could not determine image width for \"broken.png\""
}
```

## Extras

- `postman_collection.json` contains local Postman requests for `/health` and `/convert`.
- The worker currently supports AVIF, WebP, and JPEG output variants only.
