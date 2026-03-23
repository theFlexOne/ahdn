import { index, layout, route } from '@react-router/dev/routes';

import type { RouteConfig } from "@react-router/dev/routes";

export default [
  layout("layout/Layout.tsx", [
    index("routes/home.tsx"),
    route("bio", "routes/bio.tsx"),
    route("schedule", "routes/schedule.tsx"),
    route("gallery", "routes/gallery.tsx"),
    route("song-list", "routes/songList.tsx"),
    route("contact", "routes/contact.tsx"),
    route("*", "routes/notFound.tsx"),
  ]),
] satisfies RouteConfig;
