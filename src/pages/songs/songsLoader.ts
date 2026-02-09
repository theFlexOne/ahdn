import { DUMMY_SONG_LIST } from "@/dummyData";

export default async function songsLoader() {
  return {
    songs: DUMMY_SONG_LIST,
  }
}