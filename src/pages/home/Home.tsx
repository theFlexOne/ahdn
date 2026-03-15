import AHDNLogo from "@/components/AHDNLogo";
import HeroVideo from "@/components/HeroVideo";
import { Page } from "@/layout";
import { useLoaderData } from "react-router";

type HomeLoaderData = {
  videoUrls: {
    src: string;
    type: string;
  }[];
  posterSrc: string;
};

export default function Home() {
  const { videoUrls, posterSrc } = useLoaderData() as HomeLoaderData;

  return (
    <div className="relative isolate">
      <div aria-hidden className="pointer-events-none sticky top-0 h-svh overflow-hidden">
        <HeroVideo
          urls={videoUrls}
          posterSrc={posterSrc}
          className="h-full w-full object-cover brightness-50"
          fallbackImgClassName="h-full w-full object-cover brightness-50"
          dim={30}
        />
      </div>

      <Page className="-mt-[100svh] min-h-svh justify-center bg-transparent px-6 py-12 sm:px-10">
        <AHDNLogo className="w-full max-w-5xl self-center fill-gray-200/90 drop-shadow-[0_0_24px_rgba(0,0,0,0.6)]" />
        {/* expect more content here */}
      </Page>
    </div>
  )
}
