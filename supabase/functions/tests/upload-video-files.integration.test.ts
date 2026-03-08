import {
  assert,
  assertEquals,
  commandExists,
  ffprobeBytes,
  generateMp4Fixture,
  getVideoStream,
} from "./helpers/videoTestUtils.ts";

const RUN_INTEGRATION_TESTS = Deno.env.get("RUN_VIDEO_INTEGRATION_TESTS") === "1";
const FUNCTION_URL = Deno.env.get("UPLOAD_VIDEO_FILES_URL") ??
  "http://127.0.0.1:54321/functions/v1/upload-video-files";

function getAuthHeader(): HeadersInit {
  const key = Deno.env.get("SUPABASE_ANON_KEY") ??
    Deno.env.get("SUPABASE_PUBLISHABLE_KEY");

  if (!key) {
    throw new Error(
      "SUPABASE_ANON_KEY or SUPABASE_PUBLISHABLE_KEY is required for integration tests",
    );
  }

  return {
    Authorization: `Bearer ${key}`,
  };
}

async function postVideoForm(form: FormData): Promise<Response> {
  return await fetch(FUNCTION_URL, {
    method: "POST",
    headers: getAuthHeader(),
    body: form,
  });
}

Deno.test({
  name: "integration: converts uploaded MP4 fixture to webm",
  ignore: !RUN_INTEGRATION_TESTS,
  fn: async () => {
    const hasFfprobe = await commandExists("ffprobe");
    if (!hasFfprobe) {
      throw new Error("ffprobe is required for integration tests");
    }

    const bytes = await generateMp4Fixture({ width: 1280, height: 720 });
    const file = new File([bytes], "sample.mp4", { type: "video/mp4" });

    const form = new FormData();
    form.append("video", file);
    form.append("format", "webm");
    form.append("width", "720");

    const res = await postVideoForm(form);
    assertEquals(res.status, 200);

    const contentType = res.headers.get("content-type");
    assert(contentType?.includes("video/webm"));

    const outputBytes = new Uint8Array(await res.arrayBuffer());
    assert(outputBytes.length > 0);

    const metadata = await ffprobeBytes(outputBytes, ".webm");
    const stream = getVideoStream(metadata);
    assert(stream !== null);
    assertEquals(stream.width, 720);
    assertEquals(stream.codec_name, "vp9");
  },
});

Deno.test({
  name: "integration: converts uploaded MP4 fixture to mp4",
  ignore: !RUN_INTEGRATION_TESTS,
  fn: async () => {
    const hasFfprobe = await commandExists("ffprobe");
    if (!hasFfprobe) {
      throw new Error("ffprobe is required for integration tests");
    }

    const bytes = await generateMp4Fixture({ width: 1280, height: 720 });
    const file = new File([bytes], "sample.mp4", { type: "video/mp4" });

    const form = new FormData();
    form.append("video", file);
    form.append("format", "mp4");
    form.append("width", "854");

    const res = await postVideoForm(form);
    assertEquals(res.status, 200);

    const contentType = res.headers.get("content-type");
    assert(contentType?.includes("video/mp4"));

    const outputBytes = new Uint8Array(await res.arrayBuffer());
    assert(outputBytes.length > 0);

    const metadata = await ffprobeBytes(outputBytes, ".mp4");
    const stream = getVideoStream(metadata);
    assert(stream !== null);
    assertEquals(stream.width, 854);
    assertEquals(stream.codec_name, "h264");
  },
});

Deno.test({
  name: "integration: returns 400 for missing file",
  ignore: !RUN_INTEGRATION_TESTS,
  fn: async () => {
    const res = await postVideoForm(new FormData());

    assertEquals(res.status, 400);

    const body = await res.json();
    assertEquals(body.error, "Body must include a video file");
  },
});

Deno.test({
  name: "integration: portrait fixture preserves orientation after resize",
  ignore: !RUN_INTEGRATION_TESTS,
  fn: async () => {
    const hasFfprobe = await commandExists("ffprobe");
    if (!hasFfprobe) {
      throw new Error("ffprobe is required for integration tests");
    }

    const bytes = await generateMp4Fixture({ width: 720, height: 1280 });
    const file = new File([bytes], "portrait.mp4", { type: "video/mp4" });

    const form = new FormData();
    form.append("video", file);
    form.append("format", "webm");
    form.append("width", "360");

    const res = await postVideoForm(form);
    assertEquals(res.status, 200);

    const outputBytes = new Uint8Array(await res.arrayBuffer());
    assert(outputBytes.length > 0);

    const metadata = await ffprobeBytes(outputBytes, ".webm");
    const stream = getVideoStream(metadata);
    assert(stream !== null);
    assertEquals(stream.width, 360);

    const outputHeight = Number(stream.height);
    assert(Number.isFinite(outputHeight));
    assert(outputHeight > 360, "portrait output height should be greater than width");
  },
});
