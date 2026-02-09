import PageHeading from "@/components/PageHeading";
import Page from "@/layout/Page";
import { useLoaderData } from "react-router";

export default function Songs() {
  const { songs }: { songs: string[] } = useLoaderData();
  return (
    <Page>
      <PageHeading>Song List</PageHeading>
      <ul className="grid grid-cols-[repeat(3,auto)] gap-2 mx-4 mb-4 list-disc list-inside">
        {songs.map((song) => (
          <li key={song}>{song}</li>
        ))}
      </ul>
    </Page>
  )
}
