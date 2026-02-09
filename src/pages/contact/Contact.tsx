import PageHeading from "@/components/PageHeading";
import Page from "@/layout/Page";
import PageSection from "@/layout/PageSection";

export default function Contact() {
  return (
    <Page>
      <PageHeading>Contact</PageHeading>
      <PageSection className="flex flex-col gap-4 items-center">
        <p className="text-3xl font-gl">Contact A Hard Day's Night</p>
        <div className="flex flex-col gap-8 text-2xl font-semibold mt-20 text-center">
          <p><a className="text-blue-600" href="tel:6129904730">612-990-4730</a></p>
          <p><a className="text-blue-600" href="mailto:harddaysnighttribute@yahoo.com">harddaysnighttribute@yahoo.com</a></p>
        </div>
      </PageSection>

    </Page>
  )
}
