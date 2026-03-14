import parseFormData from "../upload-image-files/helpers/parseFormData.ts";
import parseRequestOptions from "../upload-image-files/helpers/parseRequestOptions.ts";
import { assert, assertEquals } from "./helpers/testUtils.ts";

Deno.test("parseFormData groups indexed image fields", () => {
  const formData = new FormData();
  formData.append(
    "file[0]",
    new File(["image-1"], "example-image1.jpg", { type: "image/jpeg" }),
  );
  formData.append("tags[0]", "hero");
  formData.append("tags[0]", "homepage");
  formData.append("alt[0]", "My image");
  formData.append("metadata[0]", JSON.stringify({ section: "home" }));
  formData.append(
    "file[1]",
    new File(["image-2"], "example-image2.png", { type: "image/png" }),
  );
  formData.append("metadata[1]", JSON.stringify({ section: "about" }));

  const parsed = parseFormData(formData);

  assertEquals(parsed.length, 2);
  assertEquals(parsed[0].file.name, "example-image1.jpg");
  assertEquals(
    JSON.stringify(parsed[0].tags),
    JSON.stringify(["hero", "homepage"]),
  );
  assertEquals(parsed[0].alt, "My image");
  assertEquals(
    JSON.stringify(parsed[0].metadata),
    JSON.stringify({ section: "home" }),
  );
  assertEquals(parsed[1].file.name, "example-image2.png");
  assertEquals(JSON.stringify(parsed[1].tags), JSON.stringify([]));
  assertEquals(parsed[1].alt, "example-image2");
});

Deno.test("parseFormData throws for invalid metadata JSON", () => {
  const formData = new FormData();
  formData.append(
    "file[0]",
    new File(["image-1"], "example-image1.jpg", { type: "image/jpeg" }),
  );
  formData.append("metadata[0]", "{bad-json");

  let message = "";

  try {
    parseFormData(formData);
  } catch (error) {
    message = error instanceof Error ? error.message : String(error);
  }

  assert(message.includes('Field "metadata[0]" is invalid'));
});

Deno.test("parseRequestOptions reads preset and upsert values", () => {
  const formData = new FormData();
  formData.append("preset", "hero");
  formData.append("upsert", "true");

  const options = parseRequestOptions(formData);

  assertEquals(options.preset, "hero");
  assertEquals(options.upsert, true);
});
