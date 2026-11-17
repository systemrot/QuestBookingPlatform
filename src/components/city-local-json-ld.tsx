import { getCitySeo } from "@/config/city-seo";
import { getSiteUrl, siteConfig } from "@/config/site";
import type { CitySlug } from "@/lib/city";

type Props = {
  citySlug: CitySlug;
};

/**
 * City-scoped schema: always WebPage + Organization areaServed.
 * LocalBusiness only when streetAddress is filled for that city (real NAP).
 */
export function CityLocalJsonLd({ citySlug }: Props) {
  const siteUrl = getSiteUrl();
  const seo = getCitySeo(citySlug);
  const loc = siteConfig.locations[citySlug];
  const phone = siteConfig.contact.telephone.trim();
  const email = siteConfig.contact.email.trim();
  const hasStreet = Boolean(loc.streetAddress.trim());

  const orgId = `${siteUrl}/#organization`;
  const pageId = `${siteUrl}/${citySlug}#webpage`;

  const contactPoint =
    phone || email
      ? {
          "@type": "ContactPoint",
          contactType: "customer service",
          availableLanguage: ["Russian"],
          ...(phone ? { telephone: phone } : {}),
          ...(email ? { email } : {}),
        }
      : {
          "@type": "ContactPoint",
          contactType: "customer service",
          availableLanguage: ["Russian"],
          url: siteConfig.social.vk,
        };

  const organization = {
    "@type": "Organization",
    "@id": orgId,
    name: siteConfig.brandName,
    url: siteUrl,
    logo: `${siteUrl}/icon-512.png`,
    sameAs: [siteConfig.social.vk, siteConfig.social.telegram],
    areaServed: siteConfig.citiesServed.map((c) => ({
      "@type": "City",
      name: c.name,
    })),
    contactPoint,
  };

  const localBusiness = hasStreet
    ? {
        "@type": "EntertainmentBusiness",
        "@id": `${siteUrl}/${citySlug}#localbusiness`,
        name: `${siteConfig.brandName} — ${seo.name}`,
        url: `${siteUrl}/${citySlug}`,
        parentOrganization: { "@id": orgId },
        image: `${siteUrl}/brand/og-share.jpg`,
        description: seo.blurb,
        address: {
          "@type": "PostalAddress",
          streetAddress: loc.streetAddress.trim(),
          addressLocality: seo.name,
          ...(loc.postalCode.trim()
            ? { postalCode: loc.postalCode.trim() }
            : {}),
          addressCountry: loc.addressCountry,
        },
        ...(phone ? { telephone: phone } : {}),
        ...(email ? { email } : {}),
        ...(loc.geo
          ? {
              geo: {
                "@type": "GeoCoordinates",
                latitude: loc.geo.lat,
                longitude: loc.geo.lng,
              },
            }
          : {}),
        ...(loc.openingHours?.length
          ? { openingHours: [...loc.openingHours] }
          : {}),
        areaServed: {
          "@type": "City",
          name: seo.name,
        },
      }
    : null;

  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": pageId,
        url: `${siteUrl}/${citySlug}`,
        name: `Квесты ${seo.inCity} — ${siteConfig.brandName}`,
        description: seo.blurb,
        isPartOf: { "@id": `${siteUrl}/#website` },
        about: localBusiness
          ? { "@id": localBusiness["@id"] }
          : { "@id": orgId },
        inLanguage: "ru-RU",
      },
      organization,
      ...(localBusiness ? [localBusiness] : []),
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
