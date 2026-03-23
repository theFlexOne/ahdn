import { getSongList } from '@/lib/supabase/helpers';
import SongList from '@/pages/songList/SongList';

export async function clientLoader() {
  const songData = await getSongList();

  return {
    songs: songData.map((song) => song.name),
  };
}

export default function SongListRoute() {
  return <SongList />;
}
