import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("bio", "routes/bio.tsx"),
  route("schedule", "routes/schedule.tsx"),
  route("gallery", "routes/gallery.tsx"),
  route("songs", "routes/songs.tsx"),
  route("contact", "routes/contact.tsx"),
] satisfies RouteConfig;
