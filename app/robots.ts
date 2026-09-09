import type { MetadataRoute } from "next";

// GRAP is a private staff tool, not a public site — deliberately disallow ALL
// crawling, inverted from the usual robots.txt purpose. See CHECKLIST.md.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: "/" },
  };
}
