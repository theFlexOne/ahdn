import AHDNLogo from "@/components/AHDNLogo";
import HeroVideo from "@/components/HeroVideo";
import { HOME_PAGE_BACKGROUND } from "@/constants";
import { Page, PageSection } from "@/layout";
import { getEvents } from "@/lib/supabase/helpers";
import UpcomingEvents from "./components/UpcomingEvents";

export default function Home({ events }: {
  events: Awaited<ReturnType<typeof getEvents>>
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
          <p className="text-lg">
            Recognized by Joey Molland of Badfinger and Grammy-winning artist Rick Derringer, this acclaimed Beatles tribute delivers an authentic, high-energy performance that stands among the nation’s very best.
          </p>
        </PageSection>
        <PageSection>
          <UpcomingEvents events={events} />
        </PageSection>
      </div>
    </Page>
  )
}
