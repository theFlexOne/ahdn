import SongList from "@/pages/songList/SongList";
import { getSongs } from "@/lib/supabase/helpers";

export async function clientLoader() {
  const songData = await getSongs();

  return {
    songs: songData.map((song) => song.name),
  };
}

export default function SongsRoute() {
  return <SongList />;
}
