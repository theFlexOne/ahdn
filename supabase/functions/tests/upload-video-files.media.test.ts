import convertVideoFile from "../upload-video-files/helpers/convertVideoFile.ts";
import {
  assert,
  assertEquals,
  commandExists,
  ffprobeBytes,
  generateMp4Fixture,
  getVideoStream,
} from "./helpers/videoTestUtils.ts";

const RUN_MEDIA_TESTS = Deno.env.get("RUN_VIDEO_MEDIA_TESTS") === "1";

Deno.test({
  name: "media: convert landscape fixture to webm with requested width",
  ignore: !RUN_MEDIA_TESTS,
  fn: async () => {
    const hasFfmpeg = await commandExists("ffmpeg");
    const hasFfprobe = await commandExists("ffprobe");
    if (!hasFfmpeg || !hasFfprobe) {
      throw new Error("ffmpeg and ffprobe are required for media tests");
    }

    const inputBytes = await generateMp4Fixture({ width: 1280, height: 720 });
    const inputFile = new File([inputBytes], "landscape.mp4", {
      type: "video/mp4",
    });

    const output = await convertVideoFile(inputFile, "webm", 640);
    const outputBytes = new Uint8Array(await output.arrayBuffer());

    assert(outputBytes.length > 0);
    assertEquals(output.type, "video/webm");

    const metadata = await ffprobeBytes(outputBytes, ".webm");
    const videoStream = getVideoStream(metadata);

    assert(videoStream !== null);
    assertEquals(videoStream.width, 640);
    assertEquals(videoStream.codec_name, "vp9");
  },
});

Deno.test({
  name: "media: portrait input keeps aspect ratio while applying width",
  ignore: !RUN_MEDIA_TESTS,
  fn: async () => {
    const hasFfmpeg = await commandExists("ffmpeg");
    const hasFfprobe = await commandExists("ffprobe");
    if (!hasFfmpeg || !hasFfprobe) {
      throw new Error("ffmpeg and ffprobe are required for media tests");
    }

    const inputBytes = await generateMp4Fixture({ width: 720, height: 1280 });
    const inputFile = new File([inputBytes], "portrait.mp4", {
      type: "video/mp4",
    });

    const output = await convertVideoFile(inputFile, "mp4", 360);
    const outputBytes = new Uint8Array(await output.arrayBuffer());

    assert(outputBytes.length > 0);
    assertEquals(output.type, "video/mp4");

    const metadata = await ffprobeBytes(outputBytes, ".mp4");
    const videoStream = getVideoStream(metadata);

    assert(videoStream !== null);
    assertEquals(videoStream.width, 360);
    assertEquals(videoStream.codec_name, "h264");

    const outputHeight = Number(videoStream.height);
    assert(Number.isFinite(outputHeight));
    assert(outputHeight > 360, "portrait output height should be greater than width");
  },
});
