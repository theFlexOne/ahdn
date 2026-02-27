import { fetchSongs } from "@/lib/supabaseHelpers";

export default async function songsLoader() {
  const songData = await fetchSongs();
  const songs = songData.map((song) => song.name);
  return {
    songs: songs,
  }
}