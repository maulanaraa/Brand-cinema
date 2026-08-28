const CLIENT_KEY = import.meta.env.VITE_MIDTRANS_CLIENT_KEY ?? '';
const IS_PRODUCTION = import.meta.env.VITE_MIDTRANS_IS_PRODUCTION === 'true';

let loadPromise: Promise<void> | null = null;

export function loadMidtransSnap(): Promise<void> {
  if (typeof window !== 'undefined' && window.snap) {
    return Promise.resolve();
  }

  if (!CLIENT_KEY) {
    return Promise.reject(new Error('VITE_MIDTRANS_CLIENT_KEY is not configured'));
  }

  if (loadPromise) return loadPromise;

  const src = IS_PRODUCTION
    ? 'https://app.midtrans.com/snap/snap.js'
    : 'https://app.sandbox.midtrans.com/snap/snap.js';

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Midtrans Snap')));
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.type = 'text/javascript';
    script.setAttribute('data-client-key', CLIENT_KEY);
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Midtrans Snap'));
    document.body.appendChild(script);
  });

  return loadPromise;
}
