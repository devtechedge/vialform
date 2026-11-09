import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.APP_URL ?? "https://vialform.vercel.app";
  const paths = ["", "/materials", "/quality", "/procurement", "/research-notes", "/company", "/contact", "/compare"];
  return paths.map((path) => ({ url: `${base}${path}`, changeFrequency: "weekly" as const, priority: path === "" ? 1 : 0.7 }));
}