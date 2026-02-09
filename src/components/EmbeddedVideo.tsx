import { cn } from "@/lib/utils";

export default function EmbeddedVideo({ className, src }: { className?: string; src?: string }) {
  return (
    <div className={cn('aspect-video', className)}>
      <iframe
        className="h-full w-full"
        src={src}
        title="YouTube video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      ></iframe>
    </div>
  )
}
