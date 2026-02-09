import PageHeading from "@/components/PageHeading";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import Page from "@/layout/Page";
import { useEffect, useMemo, useState } from "react";
import { useLoaderData } from "react-router";

function mod(n: number, m: number) {
  return ((n % m) + m) % m;
}

function prefetch(url?: string) {
  if (!url) return;
  const img = new Image();
  img.decoding = "async";
  img.src = url;
}

export default function Gallery() {
  const { images }: { images: string[] } = useLoaderData();

  const [api, setApi] = useState<CarouselApi | null>(null);
  const [selected, setSelected] = useState(0);

  const count = images.length;

  // Keep a small window mounted: current ± 2 (tweak as desired)
  const mountedSet = useMemo(() => {
    if (count === 0) return new Set<number>();
    const set = new Set<number>();
    for (let d = -2; d <= 2; d++) set.add(mod(selected + d, count));
    return set;
  }, [selected, count]);

  useEffect(() => {
    if (!api || count === 0) return;

    const onSelect = () => setSelected(api.selectedScrollSnap());
    onSelect(); // initialize
    api.on("select", onSelect);

    return () => {
      api.off("select", onSelect);
    };
  }, [api, count]);

  // Prefetch next/prev whenever selected changes
  useEffect(() => {
    if (count === 0) return;
    prefetch(images[mod(selected + 1, count)]);
    prefetch(images[mod(selected - 1, count)]);
  }, [selected, count, images]);

  return (
    <Page className="gap-10">
      <PageHeading>Gallery</PageHeading>
      <Carousel
        setApi={setApi}
        opts={{ loop: true, align: "center" }}
      >
        <CarouselContent className="bg-gray-400/50">
          {images.map((src, i) => {
            const isActive = i === selected;
            const isMounted = mountedSet.has(i);

            return (
              <CarouselItem key={src ?? i} className="flex items-center justify-center">
                <div className="w-full overflow-hidden">
                  {isMounted ? (
                    <img
                      src={`/images/band/${src}`}
                      alt={`Gallery image ${i + 1}`}
                      className="w-full object-contain"
                      loading={isActive ? "eager" : "lazy"}
                      decoding="async"
                      fetchPriority={isActive ? "high" : "auto"}
                      draggable={false}
                    />
                  ) : (
                    <div className="h-[80vh] w-full bg-muted/40" />
                  )}
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>

        <CarouselPrevious size={"free"} className="py-6 bg-gray-500/30" />
        <CarouselNext size={"free"} className="py-6 bg-gray-500/30" />
      </Carousel>
    </Page>
  );
}
