/**
 * Tracking bridge.
 *
 * The site already loads Google Tag Manager (GTM-T2KCKDLR) in index.html and
 * Meta Pixel may be configured inside GTM. We therefore never inject new
 * tracking scripts or duplicate IDs here: we only push standard events into the
 * existing `dataLayer`, and call `fbq` only when a pixel is already present.
 */

type AnyWindow = Window & {
  dataLayer?: Record<string, unknown>[];
  fbq?: (...args: unknown[]) => void;
};

function pushDataLayer(event: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  const w = window as AnyWindow;
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push(event);
}

function callPixel(eventName: string, params: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  const w = window as AnyWindow;
  if (typeof w.fbq === 'function') {
    w.fbq('track', eventName, params);
  }
}

/** Deduplicates ViewContent events caused by React re-renders. */
let lastViewContentKey = '';
let lastPurchaseOrder = '';

export function trackViewContent(params: {
  id: string;
  name: string;
  price?: number;
  currency?: string;
  category?: string;
}): void {
  const key = `view:${params.id}`;
  if (lastViewContentKey === key) return;
  lastViewContentKey = key;

  const payload = {
    content_ids: [params.id],
    content_name: params.name,
    content_type: 'product',
    content_category: params.category,
    value: params.price,
    currency: params.currency || 'EGP',
  };
  pushDataLayer({ event: 'view_content', ...payload });
  callPixel('ViewContent', payload);
}

export function trackInitiateCheckout(params: {
  id: string;
  name: string;
  price?: number;
  currency?: string;
}): void {
  const payload = {
    content_ids: [params.id],
    content_name: params.name,
    content_type: 'product',
    value: params.price,
    currency: params.currency || 'EGP',
    num_items: 1,
  };
  pushDataLayer({ event: 'begin_checkout', ...payload });
  callPixel('InitiateCheckout', payload);
}

/**
 * Purchase is intentionally NOT fired when an order is submitted: the site uses
 * manual payment review, so a submitted order is not a confirmed purchase.
 * This helper exists only for a genuinely confirmed (paid) order.
 */
export function trackConfirmedPurchase(params: {
  orderNumber: string;
  id: string;
  name: string;
  price?: number;
  currency?: string;
}): void {
  // Never report the same confirmed order twice (e.g. status polling).
  if (lastPurchaseOrder === params.orderNumber) return;
  lastPurchaseOrder = params.orderNumber;

  const payload = {
    transaction_id: params.orderNumber,
    content_ids: [params.id],
    content_name: params.name,
    value: params.price,
    currency: params.currency || 'EGP',
  };
  pushDataLayer({ event: 'purchase', ...payload });
  callPixel('Purchase', payload);
}

/** Resets the ViewContent dedupe key when navigating to a different route. */
export function resetViewContentDedupe(): void {
  lastViewContentKey = '';
}
