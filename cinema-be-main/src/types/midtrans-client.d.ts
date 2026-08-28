declare module 'midtrans-client' {
  interface SnapOptions {
    isProduction?: boolean;
    serverKey?: string;
    clientKey?: string;
  }

  interface SnapTransactionResult {
    token: string;
    redirect_url: string;
  }

  class Snap {
    constructor(options?: SnapOptions);
    createTransaction(parameter: Record<string, unknown>): Promise<SnapTransactionResult>;
    transaction: {
      status(orderId: string): Promise<Record<string, unknown>>;
    };
  }

  class CoreApi {
    constructor(options?: SnapOptions);
    charge(parameter: Record<string, unknown>): Promise<Record<string, unknown>>;
    transaction: {
      status(orderId: string): Promise<Record<string, unknown>>;
      cancel(orderId: string): Promise<Record<string, unknown>>;
      expire(orderId: string): Promise<Record<string, unknown>>;
    };
  }

  const MidtransClient: {
    Snap: typeof Snap;
    CoreApi: typeof CoreApi;
  };

  export default MidtransClient;
}
