import AHDNLogo from "@/components/AHDNLogo";
import HeroVideo from "@/components/HeroVideo";
import { Page, PageSection } from "@/layout";
import { HOME_PAGE_BACKGROUND, MEDIA_BUCKET } from "@/constants";
import { getSupabaseStorageUrl } from "@/lib/supabaseHelpers";

export default function Home() {
  return (
    <Page className="relative mt-12"> {/* main page container for every page */}
      <div>
        <HeroVideo
          primarySrc={buildSrc(HOME_PAGE_BACKGROUND.primaryVideo)}
          secondarySrc={buildSrc(HOME_PAGE_BACKGROUND.secondaryVideo)}
          posterSrc={buildSrc(HOME_PAGE_BACKGROUND.poster)}
          className="fixed top-10 overflow-hidden -z-10"
        />
        <AHDNLogo className="mx-auto h-screen w-7xl" />
      </div>

      <div className="flex flex-col gap-8 m-8"> {/* main content container */}
        <PageSection>
          <p className="text-lg text-white">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Corporis explicabo possimus tenetur quam adipisci deleniti itaque eos vitae quod repellat praesentium ducimus consequuntur earum dolores, nostrum odit ut eligendi. Sequi!
            Asperiores adipisci necessitatibus doloribus eos magni pariatur consequatur quo id, maxime explicabo iure alias officia ut aut eveniet, ipsum dignissimos molestias error iste in reiciendis saepe? Nisi excepturi et id.
            Esse, iure. Accusamus, praesentium natus officiis ipsum quo dolorem cumque autem architecto a totam. Quidem, quibusdam, consequuntur assumenda laborum omnis ratione enim asperiores, commodi maxime facilis delectus! Eum, delectus commodi?
            Et, fugit maiores? Qui porro voluptatum tempora numquam sit libero molestiae ducimus distinctio eum, ullam possimus, illum nam commodi delectus atque repellendus! In, aperiam. Voluptatem minus autem perferendis dolor nemo.
            Consequuntur incidunt distinctio id quia mollitia voluptatum similique at necessitatibus sunt sequi, ab labore doloribus, quidem eum quisquam ex molestiae inventore ullam adipisci. Ducimus ipsum sapiente neque magnam eum veniam!
            Voluptate animi repudiandae voluptatem ullam adipisci aspernatur, laborum veritatis non placeat aut reprehenderit suscipit rem? Consectetur vitae amet qui, vel nisi ipsum in aliquid eos distinctio cum minima, consequatur illo.
            Labore sunt facilis tempora blanditiis nulla! Qui veniam ea inventore illo adipisci et quis ducimus reiciendis, labore ut nam reprehenderit maxime mollitia molestias rerum, blanditiis aliquid ad nisi iure odio.
            Natus assumenda quod illum facilis ea illo tempora animi iste, deleniti provident ab, labore praesentium perspiciatis rerum dolorem a reprehenderit architecto qui omnis quae incidunt. Sit expedita neque beatae maiores.</p>
        </PageSection>
        <PageSection>
          <AHDNLogo />
        </PageSection>
        <PageSection>
          <AHDNLogo />
        </PageSection>
        <PageSection>
          {/* expect more content here */}
        </PageSection>
      </div>
    </Page>
  )
}


function buildSrc(filePath: string) {
  return `${getSupabaseStorageUrl()}/${MEDIA_BUCKET}/${filePath}`
}