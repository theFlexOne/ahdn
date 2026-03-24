import PageHeading from '@/components/PageHeading';
import { Page } from '@/layout';

export default function SongList({ songs }: { songs: string[] }) {
  return (
    <Page className="flex-col items-center gap-12 relative">
      <PageHeading>Song List</PageHeading>
      <ul className="grid grid-cols-[repeat(3,auto)] gap-2 mx-4 mb-4 list-disc list-inside">
        {songs.map((song) => (
          <li key={song}>{song}</li>
        ))}
      </ul>
    </Page>
  )
}
