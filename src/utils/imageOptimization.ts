const KNOWN_OPTIMIZED_COVERS = new Set([
  '10f7356eb_1',
  '923169cae_',
  '8b03f1d66_8',
  '1b56e2799_',
  '0e4c416bd_',
  '187d77c08_',
  'e07133539_',
  '31986c3ca_',
]);

export interface OptimizedCoverSources {
  webpSrcSet?: string;
  webpDefaultSrc?: string;
  fallbackSrc: string;
}

/**
 * Inspects a Base44 or local image URL and returns responsive WebP srcSet
 * (480w for mobile/carousel, 768w for desktop/high-DPI) while preserving
 * the original URL as a fallback.
 */
export function getOptimizedCoverSources(rawUrl?: string): OptimizedCoverSources {
  const url = String(rawUrl || '').trim();
  if (!url) {
    return { fallbackSrc: '' };
  }

  const match = url.match(/\/([^/?#]+)\.(png|jpg|jpeg|webp)(?:\?.*)?$/i);
  if (match) {
    const baseName = match[1];
    if (KNOWN_OPTIMIZED_COVERS.has(baseName)) {
      const src480 = `/media/covers/${baseName}-480w.webp`;
      const src768 = `/media/covers/${baseName}-768w.webp`;
      return {
        webpSrcSet: `${src480} 480w, ${src768} 768w`,
        webpDefaultSrc: src480,
        fallbackSrc: url,
      };
    }
  }

  return { fallbackSrc: url };
}
