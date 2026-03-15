import type { ComponentPropsWithRef } from "react";
import type { ImageBase } from "@/types";

export type ImageProps = ImageBase & ComponentPropsWithRef<"img">;

function buildSrcSet(
  formatFile: ImageBase["files"][number] | undefined,
) {
  return formatFile?.srcList
    .map(({ src, width }) => `${src} ${width}w`)
    .join(", ");
}

export default function Image({
  files,
  alt,
  className,
  ...imgProps
}: ImageProps) {
  const avifFile = files.find(({ mimetype }) => mimetype === "image/avif")!;
  const webpFile = files.find(({ mimetype }) => mimetype === "image/webp")!;
  const jpegFile = files.find(({ mimetype }) => mimetype === "image/jpeg")!;
  const fallbackImage = jpegFile.srcList.at(-1)!;

  return (
    <picture>
      <source type={avifFile.mimetype} srcSet={buildSrcSet(avifFile)} />
      <source type={webpFile.mimetype} srcSet={buildSrcSet(webpFile)} />
      <img
        {...imgProps}
        alt={alt ?? ""}
        className={className}
        src={fallbackImage.src}
        srcSet={buildSrcSet(jpegFile)}
        width={fallbackImage.width}
        height={fallbackImage.height}
      />
    </picture>
  )
}
