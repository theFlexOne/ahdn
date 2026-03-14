import type { UploadedImageVariantsData } from "../upload-image-files/types.ts";
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

const IMAGE_FIXTURE_URL = new URL(
  "../../../public/images/bg_hero_vid_first_frame.jpg",
  import.meta.url,
);

type UploadImageResponse = {
  results: UploadedImageVariantsData[];
} | {
  error: string;
  message?: string;
};

function hasResults(
  body: UploadImageResponse,
): body is { results: UploadedImageVariantsData[] } {
  return "results" in body;
}

Deno.test({
  name: "upload-image-files uploads image variants to storage",
  async fn() {
    if (!isIntegrationTestEnabled()) {
      return;
    }

    await ensureBucketExists(DEFAULT_MEDIA_BUCKET);

    const testId = crypto.randomUUID();
    const filenameBase = `integration-image-${testId}`;
    const formData = new FormData();
    const uploadedPaths: string[] = [];

    try {
      formData.append("preset", "thumbnail");
      formData.append("upsert", "true");
      formData.append("tags[0]", "integration");
      formData.append("tags[0]", testId);
      formData.append("alt[0]", "Integration image");
      formData.append(
        "metadata[0]",
        JSON.stringify({ suite: "functions", case: "upload-image-files" }),
      );
      formData.append(
        "file[0]",
        await readFixtureFile(IMAGE_FIXTURE_URL, {
          name: `${filenameBase}.jpg`,
          type: "image/jpeg",
        }),
      );

      const response = await invokeFunction("upload-image-files", formData);
      const body = await response.json() as UploadImageResponse;

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
      assert(body.results[0].variants.length > 0, "Expected image variants");

      const variants = body.results[0].variants;
      const mimeTypes = [
        ...new Set(variants.map((variant) => variant.mimeType)),
      ]
        .sort();

      assertEquals(
        JSON.stringify(mimeTypes),
        JSON.stringify(["image/avif", "image/jpeg", "image/webp"]),
      );

      for (const variant of variants) {
        uploadedPaths.push(variant.path);
        assert(variant.path.startsWith(`images/${filenameBase}-`));
        assert(variant.width > 0);
        assert(variant.height > 0);
      }

      const metadataRows = await fetchMediaMetadataByPaths(uploadedPaths);
      assertEquals(metadataRows.length, uploadedPaths.length);

      for (const row of metadataRows) {
        assert(
          uploadedPaths.includes(row.path),
          `Unexpected metadata row: ${row.path}`,
        );
        assertEquals(row.alt, "Integration image");
        assert(row.tags?.includes("integration") === true);
        assert(row.tags?.includes(testId) === true);
      }
    } finally {
      await removeStorageObjects(uploadedPaths).catch((error) => {
        console.warn("Failed to clean up uploaded image variants:", error);
      });
    }
  },
});
