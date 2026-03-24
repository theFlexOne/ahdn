import { getSongList } from '@/lib/supabase/helpers';
import SongList from '@/pages/songList/SongList';

import type { Route } from './+types/songList';

export async function clientLoader() {
  const songData = await getSongList();

  return {
    songs: songData.map((song) => song.name),
  };
}

export default function SongListRoute({ loaderData }: Route.ComponentProps) {
  return <SongList songs={loaderData.songs} />;
}
