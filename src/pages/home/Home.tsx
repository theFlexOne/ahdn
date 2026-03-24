import { useRef } from 'react';

import AHDNLogo from '@/components/AHDNLogo';
import EmbeddedVideo from '@/components/EmbeddedVideo';
import HeroVideo from '@/components/HeroVideo';
import { PauseButton } from '@/components/PauseButton';
import { HOME_PAGE_BACKGROUND } from '@/constants';
import { useIsScrolledFromTop } from '@/hooks/useIsScrolledFromTop';
import { Page, PageSection } from '@/layout';
import { buildSrc } from '@/lib/media';
import PageCard from '@/layout/PageCard';

import UpcomingEvents from './components/UpcomingEvents';

import type { EventDetails } from "@/features/events/types";
export default function Home({ events }: {
  events: Awaited<EventDetails[]>
}) {
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
      video.pause();
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

    void video.play().catch(() => undefined);
  }

  return (
    <Page className="relative">
      <div>
        <HeroVideo
          ref={videoRef}
          primarySrc={videoSrcs.primaryVideo}
          secondarySrc={videoSrcs.secondaryVideo}
          posterSrc={videoSrcs.poster}
          className="fixed top-10 overflow-hidden -z-10"
          dim={shouldDimVideo}
        />
        <AHDNLogo className="mx-auto h-screen w-7xl [fill-opacity:0.8]" />
        <PauseButton className="fixed top-22.5 right-5 z-20" onClick={handlePause} size="sm" />
      </div>

      <div className="flex flex-col gap-8 m-8">
        <PageCard>
          <PageSection>
            <p className="text-2xl text-center tracking-widest leading-10">
              Recognized by Joey Molland of Badfinger and Grammy-winning artist Rick Derringer, this acclaimed Beatles tribute delivers an authentic, high-energy performance that stands among the nation's very best.
            </p>
          </PageSection>
        </PageCard>

        <PageCard>
          <PageSection>
            <h2 className="text-center font-ahdn text-2xl uppercase">Upcoming Events</h2>
            <UpcomingEvents events={events} />
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
            <div className='w-full flex gap-8 mt-12'>
              <div className='w-1/2'>
                <h2 className="text-center font-ahdn text-2xl uppercase mb-4">Endorsement by Rick Derringer</h2>
                <EmbeddedVideo
                  src="https://www.youtube.com/embed/Rx9XswAbeAo"
                  className="w-full"
                  onPlay={pauseVideo}
                  onPause={playVideo}
                />
              </div>
              <div className='w-1/2'>
                <h2 className="text-center font-ahdn text-2xl uppercase mb-4">Endorsement by Joey Molland</h2>
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
      </div>
    </Page>
  )
}

function getHomePageBackgroundSrcs() {
  return {
    primaryVideo: buildSrc(HOME_PAGE_BACKGROUND.primaryVideo),
    secondaryVideo: buildSrc(HOME_PAGE_BACKGROUND.secondaryVideo),
    poster: HOME_PAGE_BACKGROUND.poster,
  };
}
