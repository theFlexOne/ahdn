import AHDNLogo from "@/components/AHDNLogo";
import HeroVideo from "@/components/HeroVideo";
import { useLoaderData } from "react-router";

export default function Home2() {
  const { videoUrls, posterSrc } = useLoaderData();

  return (
    <div className="flex-1 min-h-0">
      <div className="relative">
        <HeroVideo
          urls={videoUrls}
          posterSrc={posterSrc}
          className="w-full h-full object-cover brightness-75"
        />
        <AHDNLogo className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10/12 fill-gray-200/90" />
      </div>
    </div>
  )
}
