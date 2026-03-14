import { supabase } from "@/lib/supabaseClient";

import type { LoaderFunctionArgs } from "react-router";

export default function layoutLoader({ request }: LoaderFunctionArgs) {
  return {
    title: "AHDN",
  };
}

function getPagePath(request: Request) {
  const url = new URL(request.url);
  return url.pathname.split("/")[1];
}
