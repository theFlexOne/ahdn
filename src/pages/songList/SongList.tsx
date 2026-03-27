import PageHeading from '@/components/PageHeading';
import { Page } from '@/layout';

export default function SongList({ songs }: { songs: string[] }) {
  return (
    <Page className="relative flex-col items-center gap-12">
      <PageHeading>Song List</PageHeading>
      <ul className="mx-4 mb-4 grid list-inside list-disc grid-cols-[repeat(3,auto)] gap-2">
        {songs.map((song) => (
          <li key={song}>{song}</li>
        ))}
      </ul>
    </Page>
  );
}
