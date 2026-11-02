import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Megaphone, ArrowUpLeft, ArrowUpRight } from 'lucide-react';
import { AdRecord, Language } from '../types/coffee';

interface AdsBannerProps {
  ads: AdRecord[];
  lang: Language;
  onNavigate: (path: string) => void;
}

function isInternal(link: string): boolean {
  return link.startsWith('/') && !link.startsWith('//');
}

function isValidLink(link: string): boolean {
  if (!link) return false;
  if (isInternal(link)) return true;
  return /^https?:\/\//i.test(link);
}

export const AdsBanner: React.FC<AdsBannerProps> = ({ ads, lang, onNavigate }) => {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<number | null>(null);

  const activeAds = useMemo(
    () => ads.filter((ad) => ad && ad.is_active && (ad.title_ar || ad.image_url)),
    [ads]
  );

  const count = activeAds.length;

  const goTo = useCallback(
    (next: number) => {
      if (count === 0) return;
      setIndex(((next % count) + count) % count);
    },
    [count]
  );

  useEffect(() => {
    if (index >= count && count > 0) setIndex(0);
  }, [count, index]);

  useEffect(() => {
    if (count <= 1 || paused) return;
    timerRef.current = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % count);
    }, 6500);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [count, paused]);

  if (count === 0) return null;

  const ad = activeAds[Math.min(index, count - 1)];
  const link = (ad.link_url || '').trim();
  const hasLink = isValidLink(link);
  const cta = ad.cta_label?.trim() || (lang === 'ar' ? 'اكتشف المزيد' : 'Learn more');
  const ArrowIcon = lang === 'ar' ? ArrowUpLeft : ArrowUpRight;

  const handleClick = (e: React.MouseEvent) => {
    if (!hasLink) {
      e.preventDefault();
      return;
    }
    if (isInternal(link)) {
      e.preventDefault();
      onNavigate(link);
    }
  };

  const content = (
    <>
      {ad.image_url ? (
        <img
          src={ad.image_url}
          alt={ad.title_ar || 'إعلان'}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
        />
      ) : (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(149,1,1,0.9),rgba(26,26,26,0.95))]"
        />
      )}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-l from-black/85 via-black/55 to-black/15"
      />
      <div className="relative z-10 flex h-full w-full flex-col justify-end gap-2 p-5 sm:p-8 md:p-10 max-w-2xl">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#950101] px-2.5 py-1 text-[10px] sm:text-[11px] font-semibold text-white">
          <Megaphone size={12} strokeWidth={2} />
          {lang === 'ar' ? 'إعلان' : 'Sponsored'}
        </span>
        <h2 className="font-display text-lg sm:text-2xl md:text-3xl font-bold leading-snug text-white drop-shadow">
          {ad.title_ar}
        </h2>
        {ad.subtitle_ar && (
          <p className="text-[12px] sm:text-sm md:text-base text-white/85 leading-relaxed line-clamp-2">
            {ad.subtitle_ar}
          </p>
        )}
        {hasLink && (
          <span className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[11px] sm:text-xs font-bold text-[#111111] transition-colors group-hover:bg-[#D4AF37]">
            {cta}
            <ArrowIcon size={14} strokeWidth={2} />
          </span>
        )}
      </div>
    </>
  );

  const wrapperClass =
    'group relative block w-full overflow-hidden rounded-2xl border border-[var(--line)] bg-[#1A1A1A] aspect-[16/9] sm:aspect-[21/9] md:aspect-[24/9]';

  return (
    <section
      aria-label={lang === 'ar' ? 'الإعلانات والعروض' : 'Advertisements'}
      className="w-full max-w-[1200px] mx-auto px-6 py-8"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="relative">
        {hasLink ? (
          <a
            href={link}
            onClick={handleClick}
            target={isInternal(link) ? undefined : '_blank'}
            rel={isInternal(link) ? undefined : 'noopener noreferrer'}
            className={wrapperClass}
            aria-label={ad.title_ar}
          >
            {content}
          </a>
        ) : (
          <div className={wrapperClass}>{content}</div>
        )}

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              aria-label={lang === 'ar' ? 'الإعلان التالي' : 'Next advertisement'}
              className="absolute top-1/2 -translate-y-1/2 left-2 sm:left-3 z-20 h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-black/45 text-white backdrop-blur flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              aria-label={lang === 'ar' ? 'الإعلان السابق' : 'Previous advertisement'}
              className="absolute top-1/2 -translate-y-1/2 right-2 sm:right-3 z-20 h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-black/45 text-white backdrop-blur flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
              {activeAds.map((item, i) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`${lang === 'ar' ? 'إعلان' : 'Ad'} ${i + 1}`}
                  aria-current={i === index}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/80'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};
