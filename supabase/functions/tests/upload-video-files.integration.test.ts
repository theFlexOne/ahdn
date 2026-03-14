import type { UploadedVideoVariantsData } from "../upload-video-files/types.ts";
import { assert, assertEquals } from "./helpers/testUtils.ts";
import {
  DEFAULT_MEDIA_BUCKET,
  ensureBucketExists,
  fetchMediaMetadataByPaths,
  INTEGRATION_TEST_RUN_FLAG,
  invokeFunction,
  isIntegrationTestEnabled,
  readFixtureFile,
  removeStorageObjects,
} from "./helpers/integrationTestUtils.ts";

const VIDEO_FIXTURE_URL = new URL(
  "./fixtures/videos/sample-video.mp4",
  import.meta.url,
);

type UploadVideoResponse = {
  results: UploadedVideoVariantsData[];
} | {
  error: string;
  message?: string;
};

function hasResults(
  body: UploadVideoResponse,
): body is { results: UploadedVideoVariantsData[] } {
  return "results" in body;
}

Deno.test({
  name: "upload-video-files uploads converted video variants to storage",
  async fn() {
    if (!isIntegrationTestEnabled()) {
      return;
    }

    await ensureBucketExists(DEFAULT_MEDIA_BUCKET);

    const testId = crypto.randomUUID();
    const filenameBase = `integration-video-${testId}`;
    const formData = new FormData();
    const uploadedPaths: string[] = [];

    try {
      formData.append("formats", "mp4");
      formData.append("formats", "webm");
      formData.append("upsert", "true");
      formData.append("tags[0]", "integration");
      formData.append("tags[0]", testId);
      formData.append(
        "metadata[0]",
        JSON.stringify({ suite: "functions", case: "upload-video-files" }),
      );
      formData.append(
        "file[0]",
        await readFixtureFile(VIDEO_FIXTURE_URL, {
          name: `${filenameBase}.mp4`,
          type: "video/mp4",
        }),
      );

      const response = await invokeFunction("upload-video-files", formData);
      const body = await response.json() as UploadVideoResponse;

      assertEquals(
        response.status,
        200,
        `Expected 200 response. Set ${INTEGRATION_TEST_RUN_FLAG}=true and make sure the local stack and function runtime are running. ${
          JSON.stringify(body)
        }`,
      );
      if (!hasResults(body)) {
        throw new Error(`Unexpected response body: ${JSON.stringify(body)}`);
      }

      assertEquals(body.results.length, 1);
      assertEquals(body.results[0].filenameBase, filenameBase);
      assertEquals(body.results[0].variants.length, 2);

      const variants = body.results[0].variants;
      const mimeTypes = variants.map((variant) => variant.mimeType).sort();

      assertEquals(
        JSON.stringify(mimeTypes),
        JSON.stringify(["video/mp4", "video/webm"]),
      );

      for (const variant of variants) {
        uploadedPaths.push(variant.path);
        assert(variant.path.startsWith(`videos/${filenameBase}.`));
        assertEquals(variant.width, 128);
        assertEquals(variant.height, 72);
      }

      const metadataRows = await fetchMediaMetadataByPaths(uploadedPaths);
      assertEquals(metadataRows.length, uploadedPaths.length);

      for (const row of metadataRows) {
        assert(
          uploadedPaths.includes(row.path),
          `Unexpected metadata row: ${row.path}`,
        );
        assert(row.tags?.includes("integration") === true);
        assert(row.tags?.includes(testId) === true);
      }
    } finally {
      await removeStorageObjects(uploadedPaths).catch((error) => {
        console.warn("Failed to clean up uploaded video variants:", error);
      });
    }
  },
});
