import { canonicalUrl } from '../router';

export interface SeoInput {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: 'website' | 'article' | 'product';
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  locale?: 'ar' | 'en';
}

const JSON_LD_ID = 'egc-route-jsonld';

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(
    `meta[${attr}="${key}"]`
  );
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function absoluteImage(image?: string): string {
  if (!image) return canonicalUrl('/media/gates-poster.webp');
  if (/^https?:\/\//i.test(image)) return image;
  return canonicalUrl(image.startsWith('/') ? image : `/${image}`);
}

/**
 * Applies per-route metadata to the document head. This handles client-side
 * navigation; crawlers that do not execute JavaScript receive the same
 * metadata from the server-side injection in `server.ts`.
 */
export function applySeo(input: SeoInput): void {
  if (typeof document === 'undefined') return;

  const url = canonicalUrl(input.path);
  const image = absoluteImage(input.image);
  const title = input.title.trim();
  const description = input.description.trim().slice(0, 300);

  document.title = title;
  document.documentElement.lang = input.locale || 'ar';
  document.documentElement.dir = (input.locale || 'ar') === 'ar' ? 'rtl' : 'ltr';

  upsertMeta('name', 'description', description);
  upsertMeta(
    'name',
    'robots',
    input.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large'
  );
  upsertLink('canonical', url);

  upsertMeta('property', 'og:title', title);
  upsertMeta('property', 'og:description', description);
  upsertMeta('property', 'og:url', url);
  upsertMeta('property', 'og:type', input.type || 'website');
  upsertMeta('property', 'og:image', image);
  upsertMeta('property', 'og:site_name', 'تجارة القهوة المصرية | Egyptian Coffee Trade');
  upsertMeta('property', 'og:locale', (input.locale || 'ar') === 'ar' ? 'ar_EG' : 'en_US');

  upsertMeta('name', 'twitter:card', 'summary_large_image');
  upsertMeta('name', 'twitter:title', title);
  upsertMeta('name', 'twitter:description', description);
  upsertMeta('name', 'twitter:image', image);

  const existing = document.getElementById(JSON_LD_ID);
  if (existing) existing.remove();

  if (input.jsonLd) {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = JSON_LD_ID;
    script.textContent = JSON.stringify(input.jsonLd);
    document.head.appendChild(script);
  }
}

/** Schema.org BreadcrumbList helper. */
export function breadcrumbJsonLd(
  items: { name: string; path: string }[]
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: canonicalUrl(item.path),
    })),
  };
}

export function organizationJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'تجارة القهوة المصرية | Egyptian Coffee Trade',
    url: canonicalUrl('/'),
    logo: canonicalUrl('/media/logo-96w.webp'),
    sameAs: [
      'https://www.facebook.com/egcoffee.pro',
      'https://www.instagram.com/egcoffee.pro',
    ],
  };
}
