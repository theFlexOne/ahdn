import PageHeading from '@/components/PageHeading';
import { Page, PageSection } from '@/layout';

export default function Contact() {
  return (
    <Page>
      <PageHeading>Contact</PageHeading>
      <PageSection className="flex flex-col items-center gap-4">
        <p className="font-gl text-3xl">Contact A Hard Day's Night</p>
        <div className="mt-20 flex flex-col gap-8 text-center text-2xl font-semibold">
          <p>
            <a className="text-blue-600" href="tel:6129904730">
              612-990-4730
            </a>
          </p>
          <p>
            <a className="text-blue-600" href="mailto:harddaysnighttribute@yahoo.com">
              harddaysnighttribute@yahoo.com
            </a>
          </p>
        </div>
      </PageSection>
    </Page>
  );
}
