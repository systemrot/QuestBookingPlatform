import { getSiteUrl, siteConfig } from "@/config/site";

/** Organization schema — invisible to UI, helps search engines. */
export function OrganizationJsonLd() {
  const siteUrl = getSiteUrl();
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.brandName,
    url: siteUrl,
    logo: `${siteUrl}/icon-512.png`,
    sameAs: [siteConfig.social.vk, siteConfig.social.telegram],
    description: siteConfig.footerAbout,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
