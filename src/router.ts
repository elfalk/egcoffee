import { Article, ArticleCategory, CatalogItem, NavTab } from './types/coffee';

/**
 * Lightweight history-API router for Egyptian Coffee Trade.
 *
 * The application previously used a single in-memory `activeTab` state plus a
 * `?article=` query parameter. This module keeps the existing architecture but
 * maps every public destination to a real, shareable pathname so that deep
 * links, refreshes, browser back/forward and social sharing all work.
 *
 * No external routing dependency is introduced.
 */

export type Route =
  | { name: 'home' }
  | { name: 'store' }
  | { name: 'library' }
  | { name: 'courses' }
  | { name: 'beans' }
  | { name: 'blends' }
  | { name: 'calculator'; tool?: 'blend' | 'coffee-cost' }
  | { name: 'articles'; articleSlug?: string; categorySlug?: string }
  | { name: 'orders' }
  | { name: 'about' }
  | { name: 'privacy' }
  | { name: 'product'; slug: string; section: 'store' | 'library' | 'courses' }
  | { name: 'not-found' };

export const SITE_ORIGIN = 'https://www.egcoffee.pro';

export function normalizePath(pathname: string): string {
  let p = String(pathname || '/').trim();
  if (!p.startsWith('/')) p = `/${p}`;
  p = p.replace(/\/{2,}/g, '/');
  if (p.length > 1) p = p.replace(/\/+$/, '');
  return p || '/';
}

export function parseRoute(pathname: string, search = ''): Route {
  const path = normalizePath(pathname);
  const params = new URLSearchParams(search);

  // Legacy support: /?article=slug -> /articles/slug
  const legacyArticle = params.get('article');
  if (legacyArticle) {
    return { name: 'articles', articleSlug: decodeURIComponent(legacyArticle) };
  }

  const segments = path.split('/').filter(Boolean).map(decodeURIComponent);

  if (segments.length === 0) return { name: 'home' };

  const [first, second, third] = segments;

  switch (first) {
    // Aliases kept for backwards compatibility with older shared links.
    case 'products':
    case 'shop':
    case 'store':
      if (second) return { name: 'product', slug: second, section: 'store' };
      return { name: 'store' };
    case 'books':
    case 'library':
      if (second) return { name: 'product', slug: second, section: 'library' };
      return { name: 'library' };
    case 'courses':
      if (second) return { name: 'product', slug: second, section: 'courses' };
      return { name: 'courses' };
    case 'beans':
      return { name: 'beans' };
    case 'blends':
      return { name: 'blends' };
    case 'calculator':
      if (second === 'blend') return { name: 'calculator', tool: 'blend' };
      if (second === 'coffee-cost' || second === 'cost')
        return { name: 'calculator', tool: 'coffee-cost' };
      return { name: 'calculator' };
    case 'articles':
      if (second === 'category' && third)
        return { name: 'articles', categorySlug: third };
      if (second) return { name: 'articles', articleSlug: second };
      return { name: 'articles' };
    case 'orders':
      return { name: 'orders' };
    case 'about':
      return { name: 'about' };
    case 'privacy':
    case 'terms':
      return { name: 'privacy' };
    default:
      return { name: 'not-found' };
  }
}

export function routeToTab(route: Route): NavTab {
  switch (route.name) {
    case 'store':
    case 'product':
      return route.name === 'product' && route.section === 'library'
        ? 'library'
        : route.name === 'product' && route.section === 'courses'
        ? 'courses'
        : 'store';
    case 'library':
      return 'library';
    case 'courses':
      return 'courses';
    case 'beans':
      return 'beans';
    case 'blends':
      return 'blends';
    case 'calculator':
      return 'calculator';
    case 'articles':
      return 'articles';
    case 'orders':
      return 'orders';
    case 'about':
      return 'about';
    case 'privacy':
      return 'privacy';
    default:
      return 'home';
  }
}

export function tabToPath(tab: NavTab): string {
  switch (tab) {
    case 'store':
      return '/store';
    case 'library':
      return '/library';
    case 'courses':
      return '/courses';
    case 'beans':
      return '/beans';
    case 'blends':
      return '/blends';
    case 'calculator':
      return '/calculator';
    case 'articles':
      return '/articles';
    case 'orders':
      return '/orders';
    case 'about':
      return '/about';
    case 'privacy':
      return '/privacy';
    default:
      return '/';
  }
}

/**
 * Converts arbitrary Arabic/Latin text into a URL-safe slug. Arabic letters are
 * preserved (they are valid in IRIs and get percent-encoded by the browser),
 * Latin text is lower-cased and diacritics are stripped.
 */
export function slugify(input: string): string {
  return String(input || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 90);
}

function shortId(id: string): string {
  const clean = String(id || '').replace(/[^a-zA-Z0-9]/g, '');
  return clean.slice(-8) || 'item';
}

/**
 * Stable product slug: readable title slug + a deterministic suffix derived
 * from the Base44 record id. It never changes between visits and guarantees
 * uniqueness even when two products share the same title.
 */
export function productSlug(item: CatalogItem): string {
  const base = slugify(item.title_en || item.title_ar || 'product');
  return `${base || 'product'}-${shortId(item.id)}`;
}

export function productSection(item: CatalogItem): 'store' | 'library' | 'courses' {
  const type = String(item.item_type || item.type || '').toLowerCase();
  if (type === 'book' || type === 'bundle') return 'library';
  if (type === 'course') return 'courses';
  return 'store';
}

export function productPath(item: CatalogItem): string {
  return `/${productSection(item)}/${productSlug(item)}`;
}

export function findProductBySlug(
  items: CatalogItem[],
  slug: string
): CatalogItem | undefined {
  const target = decodeURIComponent(String(slug || '')).trim().toLowerCase();
  if (!target) return undefined;
  return items.find((item) => {
    if (String(item.id).toLowerCase() === target) return true;
    return productSlug(item).toLowerCase() === target;
  });
}

export function articleSlugOf(article: Article): string {
  return String(article.slug || article.id || '').trim();
}

export function articlePath(article: Article): string {
  return `/articles/${encodeURIComponent(articleSlugOf(article))}`;
}

export function articleCategorySlug(category: ArticleCategory): string {
  return String(
    category.slug || slugify(category.name_en || category.name_ar) || category.id
  );
}

export function articleCategoryPath(category: ArticleCategory): string {
  return `/articles/category/${encodeURIComponent(articleCategorySlug(category))}`;
}

/** Builds an absolute canonical URL for a path. */
export function canonicalUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`;
}
