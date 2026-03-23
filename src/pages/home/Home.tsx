import AHDNLogo from '@/components/AHDNLogo';
import EmbeddedVideo from '@/components/EmbeddedVideo';
import HeroVideo from '@/components/HeroVideo';
import { HOME_PAGE_BACKGROUND } from '@/constants';
import { useIsScrolledFromTop } from '@/hooks/useIsScrolledFromTop';
import { Page, PageSection } from '@/layout';
import PageCard from '@/layout/PageCard';

import UpcomingEvents from './components/UpcomingEvents';

import type { EventDetails } from "@/features/events/types";
export default function Home({ events }: {
  events: Awaited<EventDetails[]>
}) {

  const shouldDimVideo = useIsScrolledFromTop();

  return (
    <Page className="relative mt-12">
      <div>
        <HeroVideo
          primarySrc={HOME_PAGE_BACKGROUND.primaryVideo}
          secondarySrc={HOME_PAGE_BACKGROUND.secondaryVideo}
          posterSrc={HOME_PAGE_BACKGROUND.poster}
          className="fixed top-10 overflow-hidden -z-10"
          dim={shouldDimVideo}
        />
        <AHDNLogo className="mx-auto h-screen w-7xl" />
      </div>

      <div className="flex flex-col gap-8 m-8">
        <PageCard>
          <PageSection>
            <p className="text-3xl text-center tracking-widest leading-12">
              Recognized by Joey Molland of Badfinger and Grammy-winning artist Rick Derringer, this acclaimed Beatles tribute delivers an authentic, high-energy performance that stands among the nation's very best.
            </p>
          </PageSection>
        </PageCard>

        <PageCard>
          <PageSection>
            <UpcomingEvents events={events} />
          </PageSection>
        </PageCard>

        <PageCard>
          <PageSection>
            <div className="flex justify-center gap-12">
              <EmbeddedVideo src="https://www.youtube.com/embed/5vqgS9w-FOg" className="w-1/2" />
              <EmbeddedVideo src="https://www.youtube.com/embed/5vqgS9w-FOg" className="w-1/2" />
            </div>
          </PageSection>
        </PageCard>

        <PageCard>
          <img src="/images/banner_1-1440.avif" alt="banner" />
        </PageCard>
      </div>
    </Page>
  )
}
