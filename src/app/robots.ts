import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/workspace", "/api/"] },
    sitemap: `${process.env.APP_URL ?? "https://vialform.vercel.app"}/sitemap.xml`,
  };
}