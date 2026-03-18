import { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/pricing", "/support", "/confidentialite", "/conditions"],
        disallow: ["/app/", "/api/", "/login", "/auth/"],
      },
    ],
    sitemap: "https://cleoai.fr/sitemap.xml",
  }
}
