/**
 * Payment Provider Interface
 */

export interface CreatePaymentRequest {
  orderId: string;
  amount: number;
  currency: string;
  customer: {
    email: string;
    name?: string;
    phone?: string;
  };
  callbackUrl: string;
  metadata?: Record<string, any>;
}

export interface CreatePaymentResponse {
  paymentId: string;
  redirectUrl?: string;
  status: string;
  providerTransactionId?: string;
  expiresAt?: Date;
}

export interface RefundPaymentRequest {
  paymentId: string;
  amount?: number;
  reason?: string;
}

export interface RefundPaymentResponse {
  refundId: string;
  status: string;
  amount: number;
}

export interface PaymentProvider {
  /**
   * Create a payment request
   */
  createPayment(request: CreatePaymentRequest): Promise<CreatePaymentResponse>;

  /**
   * Get payment status
   */
  getPaymentStatus(providerTransactionId: string): Promise<any>;

  /**
   * Process refund
   */
  refundPayment(request: RefundPaymentRequest): Promise<RefundPaymentResponse>;

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: any, signature: string): boolean;
}

