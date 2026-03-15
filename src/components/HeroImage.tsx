import { cn } from "@/lib/utils";
import Image from "./Image";

import type { ImageProps } from "./Image";

//  todo: update like HeroVideo

export default function HeroImage({
  files,
  alt,
  className,
  ...imgProps
}: ImageProps) {
  return (
    <Image
      files={files}
      alt={alt}
      className={cn("w-full", className)}
      {...imgProps}
    />
  );

}
