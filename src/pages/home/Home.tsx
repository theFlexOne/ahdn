import EmbeddedVideo from "../../components/EmbeddedVideo"
import image1 from "/images/band/band-pic1.avif"
import UpcomingEvents from "./components/UpcomingEvents"
import AudioPlayer from "@/components/audioPlayer/AudioPlayer"
import { useLoaderData } from "react-router"
import Page from "@/layout/Page"
import PageSection from "@/layout/PageSection"

function Home() {
  const { events } = useLoaderData();
  return (
    <Page>
      <PageSection className="bg-uk-blue">
        <img src={image1} alt="A Hard Day's Night" className="max-w-full" />
      </PageSection>
      <PageSection className="flex flex-col gap-4 text-center font-semibold text-lg font-beatles items-center">
        <div className="w-full max-w-3xl flex flex-col gap-4">
          <p>
            A Hard Day's Night delivers a high-energy, authentic Beatles concert experience - no click tracks,
            no backing sequences, no auto-tune. Just real musicianship and the sound that defined a generation.
          </p>
          <p>
            Formed in 2006, the band is widely regarded as one of the top Beatles tribute acts in the nation,
            with endorsements from Joey Molland of Badfinger and Grammy-winning artist Rick Derringer.
            Their chemistry and long-standing friendship bring the music to life, transporting audiences
            straight back to a 1960s Beatles show.
          </p>
          <p>
            For true Beatles fans, A Hard Day's Night is a must-see!
          </p>
        </div>
      </PageSection>
      <div className="flex justify-center bg-uk-red py-4 text-white">
        <div className="w-full max-w-3xl">
          <UpcomingEvents events={events} />
        </div>
      </div>
      <div className="flex justify-center">
        <div className="w-full max-w-3xl">
          <EmbeddedVideo src="https://www.youtube.com/embed/5vqgS9w-FOg" />
        </div>
      </div>
      <div className="py-4 bg-uk-blue text-white">
        <div className="w-full max-w-3xl flex mx-auto gap-9">
          <div className="w-1/2 pb-4">
            <p>For booking and other information, please contact us at{" "}
              <a href="mailto:harddaysnighttribute@yahoo.com" className="text-uk-red">harddaysnighttribute@yahoo.com</a>
              {" "}or call{" "}
              <a href="tel:612-990-4730" className="text-uk-red">612-990-4730</a>
            </p>
          </div>
          <div className="w-1/2">
            <AudioPlayer src="https://harddaysnighttribute.com/player/1230848/tracks/2110332.mp3" />
          </div>
        </div>
      </div>
    </Page>
  )
}

export default Home

