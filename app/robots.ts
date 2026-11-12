import type { MetadataRoute } from "next";
import { SITE } from "./blog/posts";

// m.thegrind.studio/robots.txt (forwarded here by the brand domain, like the
// sitemap it names). Everything a visitor can open may be crawled; the API and
// the customer login have nothing for a search engine.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/account"] },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
