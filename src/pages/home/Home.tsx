import AHDNLogo from "@/components/AHDNLogo";
import HeroVideo from "@/components/HeroVideo";
import { Page } from "@/layout";
import { HOME_PAGE_BACKGROUND, MEDIA_BUCKET } from "@/constants";
import { getSupabaseStorageUrl } from "@/lib/supabaseHelpers";

export default function Home() {
  return (
    <Page> {/* main page container for every page */}
      <div> {/* sticky container for hero background */}
        <HeroVideo
          primarySrc={buildSrc(HOME_PAGE_BACKGROUND.primaryVideo)}
          secondarySrc={buildSrc(HOME_PAGE_BACKGROUND.secondaryVideo)}
          posterSrc={buildSrc(HOME_PAGE_BACKGROUND.poster)}
          className="h-full w-full object-cover brightness-50"
          dim={30}
        />
      </div>

      <div> {/* main content container */}
        <section className="w-full max-w-5xl self-center">
          <AHDNLogo className="fill-gray-200/90 drop-shadow-[0_0_24px_rgba(0,0,0,0.6)]" />
        </section>
        <section>
          {/* expect more content here */}
        </section>
      </div>
    </Page>
  )
}


function buildSrc(filePath: string) {
  return `${getSupabaseStorageUrl()}/${MEDIA_BUCKET}/${filePath}`
}