const CLIENT_KEY = import.meta.env.VITE_MIDTRANS_CLIENT_KEY ?? '';
const IS_PRODUCTION = import.meta.env.VITE_MIDTRANS_IS_PRODUCTION === 'true';
const SCRIPT_URL = 'https://api.midtrans.com/v2/assets/js/midtrans-new-3ds.min.js';

export interface CardTokenInput {
  cardNumber: string;
  expMonth: string;
  expYear: string;
  cvv: string;
}

let loadPromise: Promise<void> | null = null;

export class MidtransCardError extends Error {
  constructor(
    message: string,
    public validationMessages: string[] = [],
  ) {
    super(message);
    this.name = 'MidtransCardError';
  }
}

export async function loadMidtransCard3ds(): Promise<void> {
  if (typeof window !== 'undefined' && window.MidtransNew3ds) {
    return Promise.resolve();
  }

  if (!CLIENT_KEY) {
    throw new Error('VITE_MIDTRANS_CLIENT_KEY is not configured');
  }

  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById('midtrans-card-script') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Midtrans 3DS')));
      return;
    }

    const script = document.createElement('script');
    script.id = 'midtrans-card-script';
    script.src = SCRIPT_URL;
    script.type = 'text/javascript';
    script.setAttribute('data-environment', IS_PRODUCTION ? 'production' : 'sandbox');
    script.setAttribute('data-client-key', CLIENT_KEY);
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Midtrans 3DS'));
    document.body.appendChild(script);
  });

  return loadPromise;
}

export function getCardToken(card: CardTokenInput): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!window.MidtransNew3ds) {
      reject(new Error('Midtrans 3DS is not loaded'));
      return;
    }

    const cardNumber = card.cardNumber.replace(/\s/g, '');
    const expYear = card.expYear.length === 2 ? `20${card.expYear}` : card.expYear;

    window.MidtransNew3ds.getCardToken(
      {
        card_number: cardNumber,
        card_exp_month: card.expMonth,
        card_exp_year: expYear,
        card_cvv: card.cvv,
      },
      {
        onSuccess: (response) => {
          if (!response.token_id) {
            reject(new MidtransCardError(response.status_message || 'Failed to tokenize card'));
            return;
          }
          resolve(response.token_id);
        },
        onFailure: (response) => {
          reject(
            new MidtransCardError(
              response.status_message || 'Card tokenization failed',
              response.validation_messages ?? [],
            ),
          );
        },
      },
    );
  });
}

export type Card3dsResult = 'success' | 'failure' | 'pending';

export function authenticateCard3ds(
  redirectUrl: string,
  onOpen: (url: string) => void,
): Promise<Card3dsResult> {
  return new Promise((resolve) => {
    if (!window.MidtransNew3ds) {
      resolve('failure');
      return;
    }

    window.MidtransNew3ds.authenticate(redirectUrl, {
      performAuthentication: onOpen,
      onSuccess: () => resolve('success'),
      onFailure: () => resolve('failure'),
      onPending: () => resolve('pending'),
    });
  });
}
