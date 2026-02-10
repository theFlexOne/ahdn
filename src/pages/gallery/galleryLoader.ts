import { supabase } from "@/lib/supabaseClient";

export default async function galleryLoader() {
  const { data: images } = await supabase.from("images").select("*").eq("tag", "gallery");
  return { images };
}