import Songs from "@/pages/songs/Songs";
import { fetchSongs } from "@/lib/supabaseHelpers";

export async function clientLoader() {
  const songData = await fetchSongs();

  return {
    songs: songData.map((song) => song.name),
  };
}

export default function SongsRoute() {
  return <Songs />;
}
