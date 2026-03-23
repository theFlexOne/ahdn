import { cn } from '@/lib/utils';

export default function EmbeddedVideo({ className, src, title }: {
  className?: string;
  src?: string;
  title?: string;
  onPlay?: () => void
}) {
  return (
    <div className={cn(className)}>
      <iframe
        src={src}
        className="w-full aspect-video"
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      ></iframe>
    </div>
  )
}
