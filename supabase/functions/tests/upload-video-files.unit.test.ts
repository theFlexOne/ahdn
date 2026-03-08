import convertVideoFile, {
  getConvertedFilename,
  isVideoFormat,
  RunFfmpegInput,
} from "../upload-video-files/helpers/convertVideoFile.ts";
import { assert, assertEquals } from "./helpers/videoTestUtils.ts";

Deno.test("convertVideoFile returns converted file metadata", async () => {
  const calls: RunFfmpegInput[] = [];
  const inputFile = new File([new Uint8Array([1, 2, 3])], "sample.input.mp4", {
    type: "video/mp4",
  });

  const output = await convertVideoFile(inputFile, "webm", 720, {
    ffmpegPath: "/mock/ffmpeg",
    runFfmpeg: async (input) => {
      calls.push(input);
      return new Uint8Array([9, 8, 7, 6]);
    },
  });

  assertEquals(output.name, "sample.input-720.webm");
  assertEquals(output.type, "video/webm");
  assertEquals(output.size, 4);

  assertEquals(calls.length, 1);
  assertEquals(calls[0].ffmpegPath, "/mock/ffmpeg");
  assert(calls[0].args.includes("-f"));
  assert(calls[0].args.includes("webm"));
  assert(calls[0].args.includes("-vf"));
  assert(calls[0].args.some((arg) => arg.includes("scale=720")));
});

Deno.test("convertVideoFile throws for invalid format", async () => {
  const inputFile = new File([new Uint8Array([1, 2, 3])], "sample.mp4", {
    type: "video/mp4",
  });

  let message = "";

  try {
    await convertVideoFile(inputFile, "avi" as never, 720, {
      runFfmpeg: async () => new Uint8Array([1]),
      ffmpegPath: "/mock/ffmpeg",
    });
  } catch (error) {
    message = error instanceof Error ? error.message : String(error);
  }

  assertEquals(message, "format must be one of: mp4, webm");
});

Deno.test("convertVideoFile throws for empty input file", async () => {
  const inputFile = new File([], "sample.mp4", {
    type: "video/mp4",
  });

  let message = "";

  try {
    await convertVideoFile(inputFile, "mp4", 720, {
      runFfmpeg: async () => new Uint8Array([1]),
      ffmpegPath: "/mock/ffmpeg",
    });
  } catch (error) {
    message = error instanceof Error ? error.message : String(error);
  }

  assertEquals(message, "video file must not be empty");
});

Deno.test("convertVideoFile throws for invalid width", async () => {
  const inputFile = new File([new Uint8Array([1])], "sample.mp4", {
    type: "video/mp4",
  });

  let message = "";

  try {
    await convertVideoFile(inputFile, "mp4", 0, {
      runFfmpeg: async () => new Uint8Array([1]),
      ffmpegPath: "/mock/ffmpeg",
    });
  } catch (error) {
    message = error instanceof Error ? error.message : String(error);
  }

  assertEquals(message, "width must be a positive integer");
});

Deno.test("getConvertedFilename keeps original basename", () => {
  assertEquals(getConvertedFilename("clip.final.v1.mp4", "mp4", 854), "clip.final.v1-854.mp4");
});

Deno.test("isVideoFormat only allows mp4 and webm", () => {
  assertEquals(isVideoFormat("mp4"), true);
  assertEquals(isVideoFormat("webm"), true);
  assertEquals(isVideoFormat("mov"), false);
});
