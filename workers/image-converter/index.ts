import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type NextFunction, type Request, type Response } from 'express';
import { port, upload } from './constants.js';
import {
  createImageVariants,
  getImageErrorStatus,
  isRecord,
  parseMultipartFiles,
  parseRequestOptions,
  requireWorkerSecret,
} from './helpers.js';

export { createImageVariants, parseMultipartFiles, parseRequestOptions } from './helpers.js';
export type { UploadedFile } from './types.js';

export const app = express();

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.post(
  '/convert',
  requireWorkerSecret,
  upload.any(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = isRecord(req.body) ? req.body : {};
      const files = Array.isArray(req.files) ? req.files : [];
      const options = parseRequestOptions(body);
      const parsedFiles = parseMultipartFiles(files);

      if (parsedFiles.length === 0) {
        res.status(400).json({ error: 'Body must include at least one image file' });
        return;
      }

      const results = await createImageVariants(parsedFiles, options.preset);

      res.json({ results });
    } catch (error) {
      next(error);
    }
  },
);

app.use((error: unknown, _req: Request, res: Response): void => {
  const message = error instanceof Error ? error.message : String(error);
  const status = getImageErrorStatus(message);

  if (status === 500) {
    console.error('Error processing uploaded images:', error);
  }

  res.status(status).json({
    error: status === 400 ? message : 'Failed to process uploaded images',
    ...(status === 500 ? { message } : {}),
  });
});

const isDirectRun =
  process.env.NODE_ENV !== 'test' &&
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  app.listen(port, '0.0.0.0', () => {
    console.log(`Image worker listening on port ${port}`);
  });
}
