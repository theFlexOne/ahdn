import type { ImageMetadata } from "@/types";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, type CarouselApi } from "./ui/carousel";
import { useState, useEffect, useMemo } from "react";

type ImageCarouselProps = {
  images: ImageMetadata[],
  windowRadius?: number
}

export default function ImageCarousel({ images, windowRadius = 2 }: ImageCarouselProps) {
  const [api, setApi] = useState<CarouselApi | null>(null);
  const [selected, setSelected] = useState(0);

  const count = images.length;

  const mountedSet = useMemo(() => {
    if (count === 0) return new Set<number>();
    const set = new Set<number>();
    for (let d = -windowRadius; d <= windowRadius; d++) {
      set.add(mod(selected + d, count));
    }
    return set;
  }, [selected, count, windowRadius]);


  useEffect(() => {
    if (count === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelected(prev => prev === 0 ? prev : 0);
      return;
    }
    setSelected((prev) => mod(prev, count));
  }, [count]);

  useEffect(() => {
    if (!api || count === 0) return;

    const onSelect = () => setSelected(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);

    return () => {
      api.off("select", onSelect);
    };
  }, [api, count]);

  useEffect(() => {
    if (count === 0) return;

    const next = images[mod(selected + 1, count)];
    const prev = images[mod(selected - 1, count)];

    prefetch(next.path);
    prefetch(prev.path);
  }, [selected, count, images]);

  const isMounted = (index: number) => mountedSet.has(index);
  const isActive = (index: number) => index === selected;

  return (
    <div>
      <Carousel setApi={setApi} opts={{ loop: true, align: "center" }}>
        <CarouselContent className="bg-gray-400/50">
          {images.map((src, i) => (
            <CarouselItem
              key={src.id ?? i}
              className="flex items-center justify-center"
            >
              <div className="w-full overflow-hidden">
                {isMounted(i) ? (
                  <img
                    src={src.path}
                    alt={`Gallery image ${i + 1}`}
                    className="w-full object-contain"
                    loading={isActive(i) ? "eager" : "lazy"}
                    decoding="async"
                    fetchPriority={isActive(i) ? "high" : "auto"}
                    draggable={false}
                  />
                ) : (
                  <div className="h-[80vh] w-full bg-muted/40" />
                )}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        <CarouselPrevious size="free" className="py-6 bg-gray-500/30" />
        <CarouselNext size="free" className="py-6 bg-gray-500/30" />
      </Carousel>

    </div>
  )
}


function mod(n: number, m: number) {
  return ((n % m) + m) % m;
}

function prefetch(url?: string) {
  if (!url) return;
  const img = new Image();
  img.decoding = "async";
  img.src = url;
}