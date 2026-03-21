import AHDNLogo from "@/components/AHDNLogo";
import HeroVideo from "@/components/HeroVideo";
import { HOME_PAGE_BACKGROUND, MEDIA_BUCKET } from "@/constants";
import { Page, PageSection } from "@/layout";
import { fetchEvents, getSupabaseStorageUrl } from "@/lib/supabaseHelpers";
import UpcomingEvents from "./components/UpcomingEvents";

export default function Home({ events }: {
  events: Awaited<ReturnType<typeof fetchEvents>>
}) {

  return (
    <Page className="relative mt-12"> {/* main page container for every page */}
      <div>
        <HeroVideo
          primarySrc={HOME_PAGE_BACKGROUND.primaryVideo}
          secondarySrc={HOME_PAGE_BACKGROUND.secondaryVideo}
          posterSrc={HOME_PAGE_BACKGROUND.poster}
          className="fixed top-10 overflow-hidden -z-10"
        />
        <AHDNLogo className="mx-auto h-screen w-7xl" />
      </div>

      <div className="flex flex-col gap-8 m-8"> {/* main content container */}
        <PageSection>
          <p className="text-lg text-white">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Temporibus velit, alias vero reprehenderit repellendus, quisquam pariatur doloremque dolores facilis tenetur delectus. Magni, error! Iusto accusamus neque suscipit ex rem officiis.
            Iure odit harum fuga libero repellat temporibus ipsum deserunt corporis quo suscipit, unde perspiciatis omnis, assumenda ut consectetur laboriosam esse aliquid. Deleniti explicabo magnam, soluta distinctio unde illo quos eius.</p>
        </PageSection>
        <PageSection>
          <UpcomingEvents events={events} />
        </PageSection>
      </div>
    </Page>
  )
}


function buildSrc(filePath: string) {
  return `${getSupabaseStorageUrl()}/${MEDIA_BUCKET}/${filePath}`
}
