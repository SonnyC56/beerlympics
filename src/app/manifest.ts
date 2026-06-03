import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Beerlympics",
    short_name: "Beerlympics",
    description:
      "The annual backyard games — RSVP, build your team, run the tournament, watch the live scoreboard.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#07060a",
    theme_color: "#07060a",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
