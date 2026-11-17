import { getCitySeo } from "@/config/city-seo";
import { siteConfig } from "@/config/site";
import type { CitySlug } from "@/lib/city";

type Props = {
  citySlug: CitySlug;
};

/** Уникальный блок под каталогом + FAQPage JSON-LD (вне первого экрана). */
export function CitySeoPanel({ citySlug }: Props) {
  const seo = getCitySeo(citySlug);
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: seo.faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  };

  return (
    <section
      className="home-split-city-seo"
      aria-labelledby={`city-seo-heading-${citySlug}`}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />

      <h2
        id={`city-seo-heading-${citySlug}`}
        className="font-heading text-lg font-semibold tracking-tight text-white sm:text-xl"
      >
        О записи {seo.inCity}
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/80">
        {seo.blurb}
      </p>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/70">
        {seo.howToFind}
      </p>

      <div className="mt-8">
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-white/55">
          Частые вопросы · {seo.name}
        </h3>
        <dl className="mt-4 space-y-4">
          {seo.faqs.map((f) => (
            <div key={f.question} className="max-w-3xl">
              <dt className="text-sm font-medium text-white/95">{f.question}</dt>
              <dd className="mt-1.5 text-sm leading-relaxed text-white/70">
                {f.answer}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <p className="mt-8 text-xs text-white/50">
        {siteConfig.brandName} · {seo.name}
        {siteConfig.contact.telephone
          ? ` · ${siteConfig.contact.telephone}`
          : null}
      </p>
    </section>
  );
}
