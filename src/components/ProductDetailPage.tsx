import React, { useEffect } from 'react';
import {
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  GraduationCap,
  Layers,
  MonitorSmartphone,
  Package,
  ShieldCheck,
  ShoppingBag,
  Tag,
} from 'lucide-react';
import { CatalogItem, Language } from '../types/coffee';
import { getOptimizedCoverSources } from '../utils/imageOptimization';
import { productPath, productSection } from '../router';
import { applySeo, breadcrumbJsonLd, organizationJsonLd } from '../utils/seo';
import { trackViewContent } from '../utils/tracking';

interface ProductDetailPageProps {
  item: CatalogItem;
  lang: Language;
  onBack: () => void;
  onBuy: (item: CatalogItem) => void;
}

function isSoftware(item: CatalogItem): boolean {
  const type = String(item.item_type || item.type || '').toLowerCase();
  const title = `${item.title_ar} ${item.title_en || ''}`.toLowerCase();
  return (
    type.includes('software') ||
    type.includes('pos') ||
    type.includes('app') ||
    title.includes('joya') ||
    title.includes('pos')
  );
}

function schemaType(item: CatalogItem): string {
  const type = String(item.item_type || item.type || '').toLowerCase();
  if (type === 'book' || type === 'bundle') return 'Book';
  if (type === 'course') return 'Course';
  if (isSoftware(item)) return 'SoftwareApplication';
  return 'Product';
}

function typeLabel(item: CatalogItem, lang: Language): string {
  const type = String(item.item_type || item.type || '').toLowerCase();
  const labels: Record<string, { ar: string; en: string }> = {
    book: { ar: 'كتاب رقمي', en: 'Digital Book' },
    bundle: { ar: 'حزمة كتب', en: 'Book Bundle' },
    course: { ar: 'دورة تدريبية', en: 'Training Course' },
    other: { ar: 'منتج متخصص', en: 'Specialized Product' },
  };
  if (isSoftware(item)) return lang === 'ar' ? 'برنامج / نظام نقاط بيع' : 'Software / POS';
  const entry = labels[type] || { ar: 'منتج', en: 'Product' };
  return lang === 'ar' ? entry.ar : entry.en;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  item,
  lang,
  onBack,
  onBuy,
}) => {
  const isAr = lang === 'ar';
  const cover = getOptimizedCoverSources(item.cover_image);
  const section = productSection(item);
  const sectionLabel =
    section === 'library'
      ? isAr
        ? 'المكتبة الرقمية'
        : 'Digital Library'
      : section === 'courses'
      ? isAr
        ? 'الدورات التدريبية'
        : 'Courses'
      : isAr
      ? 'المتجر'
      : 'Store';

  const price = Number(item.price_egp ?? item.price ?? 0);
  const hasPrice = Number.isFinite(price) && price > 0;
  const currency = item.currency || 'EGP';
  const highlights = (isAr ? item.highlights_ar : item.highlights_en) || [];
  const description = (isAr ? item.description_ar : item.description_en) || '';

  useEffect(() => {
    const path = productPath(item);
    const type = schemaType(item);
    const productSchema: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': type,
      name: isAr ? item.title_ar : item.title_en || item.title_ar,
      description:
        description || (isAr ? item.subtitle_ar : item.subtitle_en) || item.title_ar,
      ...(item.cover_image ? { image: item.cover_image } : {}),
      ...(hasPrice
        ? {
            offers: {
              '@type': 'Offer',
              price: String(price),
              priceCurrency: currency,
              url: `https://www.egcoffee.pro${path}`,
            },
          }
        : {}),
      ...(type === 'Book' && item.pages ? { numberOfPages: item.pages } : {}),
      ...(type === 'Course' && item.duration_hours
        ? { timeRequired: `PT${item.duration_hours}H` }
        : {}),
      ...(type === 'SoftwareApplication'
        ? { applicationCategory: 'BusinessApplication', operatingSystem: 'Windows, Android' }
        : {}),
    };

    applySeo({
      title: `${isAr ? item.title_ar : item.title_en || item.title_ar} | ${isAr ? 'تجارة القهوة المصرية' : 'Egyptian Coffee Trade'}`,
      description:
        (description || item.subtitle_ar || item.title_ar).slice(0, 200),
      path,
      image: item.cover_image,
      type: 'product',
      locale: lang,
      jsonLd: [
        productSchema,
        breadcrumbJsonLd([
          { name: isAr ? 'الرئيسية' : 'Home', path: '/' },
          { name: sectionLabel, path: `/${section}` },
          { name: isAr ? item.title_ar : item.title_en || item.title_ar, path },
        ]),
        organizationJsonLd(),
      ],
    });

    trackViewContent({
      id: item.id,
      name: item.title_ar,
      price: hasPrice ? price : undefined,
      currency,
      category: item.category_ar,
    });
  }, [item, lang, description, hasPrice, price, currency, section, sectionLabel, isAr]);

  const specs: { icon: React.ReactNode; label: string; value: string }[] = [];
  if (item.pages) {
    specs.push({
      icon: <FileText size={16} />,
      label: isAr ? 'عدد الصفحات' : 'Pages',
      value: `${item.pages}`,
    });
  }
  if (item.volume_number && String(item.item_type || item.type) === 'book') {
    specs.push({
      icon: <BookOpen size={16} />,
      label: isAr ? 'رقم المجلد' : 'Volume',
      value: `${item.volume_number}`,
    });
  }
  if (item.duration_hours) {
    specs.push({
      icon: <Clock size={16} />,
      label: isAr ? 'مدة الدورة' : 'Duration',
      value: `${item.duration_hours} ${isAr ? 'ساعة' : 'hours'}`,
    });
  }
  if (item.lessons_count) {
    specs.push({
      icon: <Layers size={16} />,
      label: isAr ? 'عدد الدروس' : 'Lessons',
      value: `${item.lessons_count}`,
    });
  }
  if (item.level_ar || item.level_en) {
    specs.push({
      icon: <GraduationCap size={16} />,
      label: isAr ? 'المستوى' : 'Level',
      value: (isAr ? item.level_ar : item.level_en) || item.level_ar || '',
    });
  }
  if (item.category_ar) {
    specs.push({
      icon: <Tag size={16} />,
      label: isAr ? 'التصنيف' : 'Category',
      value: item.category_ar,
    });
  }
  if (item.unit) {
    specs.push({
      icon: <Package size={16} />,
      label: isAr ? 'الوحدة / العبوة' : 'Unit / Package',
      value: item.unit,
    });
  }
  if (item.course_schedule) {
    specs.push({
      icon: <Calendar size={16} />,
      label: isAr ? 'موعد الدورة' : 'Schedule',
      value: item.course_schedule,
    });
  }
  if (isSoftware(item)) {
    specs.push({
      icon: <MonitorSmartphone size={16} />,
      label: isAr ? 'التشغيل' : 'Deployment',
      value: isAr ? 'نظام محلي أو سحابي' : 'On-premise or cloud',
    });
  }

  return (
    <section className="py-10 md:py-16 bg-[var(--bg)]">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex flex-wrap items-center gap-2 text-[12px] text-[var(--muted)]">
            <li>
              <a href="/" className="hover:text-[var(--accent)]">
                {isAr ? 'الرئيسية' : 'Home'}
              </a>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <a href={`/${section}`} className="hover:text-[var(--accent)]">
                {sectionLabel}
              </a>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-[var(--text)] font-medium truncate max-w-[240px]">
              {isAr ? item.title_ar : item.title_en || item.title_ar}
            </li>
          </ol>
        </nav>

        <button
          type="button"
          onClick={onBack}
          className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
        >
          <ArrowRight size={16} className={isAr ? '' : 'rotate-180'} />
          {isAr ? 'رجوع' : 'Back'}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-8 lg:gap-12 items-start">
          {/* Visual + description */}
          <div className="space-y-8">
            <div className="relative overflow-hidden rounded-2xl border border-[var(--line)] bg-white aspect-[16/10]">
              {cover.fallbackSrc ? (
                <picture>
                  {cover.webpSrcSet && (
                    <source type="image/webp" srcSet={cover.webpSrcSet} sizes="(max-width: 1024px) 100vw, 720px" />
                  )}
                  <img
                    src={cover.webpDefaultSrc || cover.fallbackSrc}
                    alt={isAr ? item.title_ar : item.title_en || item.title_ar}
                    className="h-full w-full object-cover"
                    loading="eager"
                    decoding="async"
                  />
                </picture>
              ) : (
                <div
                  className="h-full w-full flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${item.cover_color || '#1A1A1A'}, ${item.cover_accent || '#950101'})`,
                  }}
                >
                  <BookOpen size={56} className="text-white/80" strokeWidth={1.2} />
                </div>
              )}
              <span className="absolute top-4 right-4 rounded-full bg-black/70 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur">
                {typeLabel(item, lang)}
              </span>
            </div>

            {description && (
              <div className="surface-card p-6 md:p-8 space-y-3">
                <h2 className="font-display text-xl font-semibold text-[var(--text)]">
                  {isAr ? 'عن هذا المنتج' : 'About this product'}
                </h2>
                <p className="text-sm md:text-base leading-relaxed text-[var(--muted)] whitespace-pre-line">
                  {description}
                </p>
              </div>
            )}

            {highlights.length > 0 && (
              <div className="surface-card p-6 md:p-8 space-y-4">
                <h2 className="font-display text-xl font-semibold text-[var(--text)]">
                  {isAr ? 'أبرز المميزات' : 'Key features'}
                </h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[var(--muted)]">
                      <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[#950101]" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {specs.length > 0 && (
              <div className="surface-card p-6 md:p-8 space-y-4">
                <h2 className="font-display text-xl font-semibold text-[var(--text)]">
                  {isAr ? 'المواصفات' : 'Specifications'}
                </h2>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {specs.map((s, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="mt-0.5 text-[#950101]">{s.icon}</span>
                      <div>
                        <dt className="text-[11px] uppercase tracking-wide text-[var(--muted)]">
                          {s.label}
                        </dt>
                        <dd className="text-sm font-medium text-[var(--text)]">{s.value}</dd>
                      </div>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>

          {/* Purchase panel */}
          <aside className="lg:sticky lg:top-24 space-y-4">
            <div className="surface-card p-6 md:p-7 space-y-4">
              <div className="space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--accent)]">
                  {typeLabel(item, lang)}
                </span>
                <h1 className="font-display text-2xl md:text-3xl font-bold leading-snug text-[var(--text)]">
                  {isAr ? item.title_ar : item.title_en || item.title_ar}
                </h1>
                {item.subtitle_ar && (
                  <p className="text-sm text-[var(--muted)]">{item.subtitle_ar}</p>
                )}
              </div>

              <div className="flex items-end gap-2 border-t border-[var(--line)] pt-4">
                {hasPrice ? (
                  <>
                    <span className="font-display text-3xl font-bold text-[#950101]">
                      {price.toLocaleString(isAr ? 'ar-EG' : 'en-US')}
                    </span>
                    <span className="pb-1 text-sm font-medium text-[var(--muted)]">
                      {currency}
                    </span>
                  </>
                ) : (
                  <span className="text-sm font-medium text-[var(--muted)]">
                    {isAr ? 'السعر عند الطلب' : 'Price on request'}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => onBuy(item)}
                className="uiverse-btn w-full !bg-[#950101] py-3 px-5 text-sm font-semibold text-white inline-flex items-center justify-center gap-2"
              >
                <ShoppingBag size={18} strokeWidth={1.6} />
                {isAr ? 'اطلب الآن' : 'Order now'}
              </button>

              <div className="flex items-start gap-2 rounded-xl bg-[var(--bg)] p-3 text-[11px] leading-relaxed text-[var(--muted)]">
                <ShieldCheck size={16} className="mt-0.5 shrink-0 text-[#950101]" />
                <span>
                  {isAr
                    ? 'يتم تأكيد الطلب ومراجعة الدفع يدويًا من فريق تجارة القهوة المصرية قبل تفعيل التحميل أو التسليم.'
                    : 'Orders are confirmed and payment is reviewed manually by the Egyptian Coffee Trade team before delivery or activation.'}
                </span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
};
