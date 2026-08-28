interface MidtransCardTokenRequest {
  card_number: string | number;
  card_exp_month: string | number;
  card_exp_year: string | number;
  card_cvv: string | number;
}

interface MidtransCardTokenSuccess {
  status_code: string;
  status_message: string;
  token_id: string;
  hash?: string;
}

interface MidtransCardTokenFailure {
  status_code: string;
  status_message: string;
  validation_messages?: string[];
}

interface Midtrans3dsAuthenticateOptions {
  performAuthentication: (redirectUrl: string) => void;
  onSuccess: (response: unknown) => void;
  onFailure: (response: unknown) => void;
  onPending?: (response: unknown) => void;
}

interface Window {
  MidtransNew3ds: {
    getCardToken: (
      cardData: MidtransCardTokenRequest,
      options: {
        onSuccess: (response: MidtransCardTokenSuccess) => void;
        onFailure: (response: MidtransCardTokenFailure) => void;
      },
    ) => void;
    authenticate: (redirectUrl: string, options: Midtrans3dsAuthenticateOptions) => void;
    redirect: (redirectUrl: string, options: { callbackUrl: string }) => void;
  };
}
