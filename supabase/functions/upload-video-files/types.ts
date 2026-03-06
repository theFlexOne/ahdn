export type RequestData = { images: unknown; preset?: unknown };

export type FfmpegArgs = {
  "-i": "pipe:0";
  "-vf": string;
  "-c:v": "libx264" | "libsvtav1";
  "-crf": number;
  "-preset": number | "slow" | "medium" | "fast" | "superfast" | "ultrafast";
  "-movflags"?: "+frag_keyframe+empty_moov";
  "-an": boolean;
  "-f": "mp4" | "webm";
  pipe: 1;
};

/*
ffmpeg \
-i pipe:0 \
-vf "scale=-2:720:flags=lanczos,fps=30" \
-c:v libx264 \
-crf 23 \
-preset slow \
-pix_fmt yuv420p \
-movflags +frag_keyframe+empty_moov \
-an \
-f mp4 \
pipe:1

ffmpeg \
-i pipe:0 \
-vf "scale=-2:720:flags=lanczos,fps=30,format=yuv420p" \
-c:v libsvtav1 \
-crf 35 \
-preset 6 \
-an \
-f webm \
pipe:1
*/
