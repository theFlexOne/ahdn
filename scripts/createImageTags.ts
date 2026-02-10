import { createClient } from "@supabase/supabase-js";
import { exit } from "node:process";

const supabaseUrl = "https://lzgryhrztslevnuajiqm.supabase.co";
const supabaseKey = "sb_secret_CpgXYvXBgxV_8TG3qUeWqg_aK3gTO96";

const supabase = createClient(supabaseUrl, supabaseKey)



const images = await supabase.storage.from("images").list("band");

const imagesMetadata = images.data?.reduce((acc, image) => {
  acc.push({
    id: image.id,
    path: `band/${image.name}`
  })
  return acc;
}, [] as { id: string, path: string }[]);

const { data: imageMetadata, error } = await supabase.from("images").insert(imagesMetadata).select();
if (error) {
  console.error(error);
  exit(1);
}

console.log(imageMetadata);


