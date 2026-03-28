import { useRef } from 'react';
import { Link } from 'react-router';

import AHDNLogo from '@/components/AHDNLogo';
import EmbeddedVideo from '@/components/EmbeddedVideo';
import HeroVideo from '@/components/HeroVideo';
import { PauseButton } from '@/components/PauseButton';
import { HOME_PAGE_BACKGROUND } from '@/constants';
import { useIsScrolledFromTop } from '@/hooks/useIsScrolledFromTop';
import { Page, PageSection } from '@/layout';
import PageCard from '@/layout/PageCard';
import { buildSrc } from '@/lib/media';

import UpcomingEvents from './components/UpcomingEvents';

import type { EventDetails } from '@/features/events/types';
export default function Home({ events }: { events: Awaited<EventDetails[]> }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const shouldDimVideo = useIsScrolledFromTop();
  const videoSrcs = getHomePageBackgroundSrcs();

  function handlePause(): void {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    if (video.paused) {
      playVideo();
    } else {
      pauseVideo();
    }
  }

  function pauseVideo(): void {
    videoRef.current?.pause();
  }

  function playVideo(): void {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    try {
      video.play();
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <Page>
      <HeroVideo
        ref={videoRef}
        primarySrc={videoSrcs.primaryVideo}
        secondarySrc={videoSrcs.secondaryVideo}
        posterSrc={videoSrcs.poster}
        className="fixed top-10 -z-10 overflow-hidden"
        dim={shouldDimVideo}
      />
      <PauseButton className="fixed top-22.5 right-5 z-20" onClick={handlePause} size="sm" />
      <AHDNLogo className="mx-auto mt-10 h-screen/80 w-7xl [fill-opacity:0.8]" />

      <PageCard>
        <PageSection>
          <p className="text-center text-2xl leading-10 tracking-widest">
            Recognized by Joey Molland of Badfinger and Grammy-winning artist Rick Derringer, this
            acclaimed Beatles tribute delivers an authentic, high-energy performance that stands
            among the nation's very best.
          </p>
        </PageSection>
      </PageCard>

      <PageCard>
        <PageSection>
          <h2 className="text-center font-ahdn text-2xl uppercase">Upcoming Events</h2>
          <UpcomingEvents events={events} />
          <Link to="/schedule" className="mt-4 block text-center hover:underline">
            View full schedule
          </Link>
        </PageSection>
      </PageCard>

      <PageCard>
        <PageSection>
          <div className="flex flex-col gap-4">
            <h2 className="text-center font-ahdn text-2xl uppercase">Promotional Video</h2>
            <EmbeddedVideo
              src="https://www.youtube.com/embed/5vqgS9w-FOg"
              className="w-full"
              onPlay={pauseVideo}
              onPause={playVideo}
            />
          </div>
          <div className="mt-12 flex w-full gap-8">
            <div className="w-1/2">
              <h2 className="mb-4 text-center font-ahdn text-2xl uppercase">
                Endorsement by Rick Derringer
              </h2>
              <EmbeddedVideo
                src="https://www.youtube.com/embed/Rx9XswAbeAo"
                className="w-full"
                onPlay={pauseVideo}
                onPause={playVideo}
              />
            </div>
            <div className="w-1/2">
              <h2 className="mb-4 text-center font-ahdn text-2xl uppercase">
                Endorsement by Joey Molland
              </h2>
              <EmbeddedVideo
                src="https://www.youtube.com/embed/Tcvod_bTBzM"
                className="w-full"
                onPlay={pauseVideo}
                onPause={playVideo}
              />
            </div>
          </div>
        </PageSection>
      </PageCard>

      <PageCard>
        <img src="/images/banner_1-1440.avif" alt="banner" />
      </PageCard>
    </Page>
  );
}

function getHomePageBackgroundSrcs() {
  return {
    primaryVideo: buildSrc(HOME_PAGE_BACKGROUND.primaryVideo),
    secondaryVideo: buildSrc(HOME_PAGE_BACKGROUND.secondaryVideo),
    poster: HOME_PAGE_BACKGROUND.poster,
  };
}
