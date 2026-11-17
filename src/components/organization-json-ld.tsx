import { getSiteUrl, siteConfig } from "@/config/site";

/** Site-wide Organization — invisible to UI, helps search engines. */
export function OrganizationJsonLd() {
  const siteUrl = getSiteUrl();
  const phone = siteConfig.contact.telephone.trim();
  const email = siteConfig.contact.email.trim();

  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: siteConfig.brandName,
        inLanguage: "ru-RU",
        publisher: { "@id": `${siteUrl}/#organization` },
      },
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: siteConfig.brandName,
        url: siteUrl,
        logo: {
          "@type": "ImageObject",
          url: `${siteUrl}/icon-512.png`,
        },
        sameAs: [siteConfig.social.vk, siteConfig.social.telegram],
        description: siteConfig.footerAbout,
        areaServed: siteConfig.citiesServed.map((c) => ({
          "@type": "City",
          name: c.name,
        })),
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer service",
          availableLanguage: ["Russian"],
          ...(phone ? { telephone: phone } : {}),
          ...(email ? { email } : {}),
          url: siteConfig.social.vk,
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
