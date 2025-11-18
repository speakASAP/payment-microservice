/**
 * PayPal Payment Service
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as paypal from 'paypal-rest-sdk';
import { LoggerService } from '../../../shared/logger/logger.service';
import {
  PaymentProvider,
  CreatePaymentRequest,
  CreatePaymentResponse,
  RefundPaymentRequest,
  RefundPaymentResponse,
} from '../payment-provider.interface';

@Injectable()
export class PayPalService implements PaymentProvider {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly mode: string;

  constructor(
    private configService: ConfigService,
    private logger: LoggerService,
  ) {
    this.clientId = this.configService.get<string>('PAYPAL_CLIENT_ID') || '';
    this.clientSecret = this.configService.get<string>('PAYPAL_CLIENT_SECRET') || '';
    this.mode = this.configService.get<string>('PAYPAL_MODE') || 'sandbox';

    paypal.configure({
      mode: this.mode,
      client_id: this.clientId,
      client_secret: this.clientSecret,
    });
  }

  async createPayment(request: CreatePaymentRequest): Promise<CreatePaymentResponse> {
    try {
      const paymentData = {
        intent: 'sale',
        payer: {
          payment_method: 'paypal',
        },
        redirect_urls: {
          return_url: `${request.callbackUrl}?success=true`,
          cancel_url: `${request.callbackUrl}?cancel=true`,
        },
        transactions: [
          {
            amount: {
              total: request.amount.toFixed(2),
              currency: request.currency,
            },
            description: `Payment for order ${request.orderId}`,
            custom: request.orderId,
          },
        ],
      };

      return new Promise((resolve, reject) => {
        paypal.payment.create(paymentData, (error, payment) => {
          if (error) {
            this.logger.error(`PayPal payment creation failed: ${error.message}`, error.stack, 'PayPalService');
            reject(error);
            return;
          }

          const approvalUrl = payment.links?.find((link: any) => link.rel === 'approval_url')?.href;

          resolve({
            paymentId: payment.id,
            redirectUrl: approvalUrl,
            status: payment.state,
            providerTransactionId: payment.id,
          });
        });
      });
    } catch (error) {
      this.logger.error(`PayPal createPayment error: ${error}`, undefined, 'PayPalService');
      throw error;
    }
  }

  async getPaymentStatus(providerTransactionId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      paypal.payment.get(providerTransactionId, (error, payment) => {
        if (error) {
          this.logger.error(`PayPal getPaymentStatus error: ${error.message}`, error.stack, 'PayPalService');
          reject(error);
          return;
        }
        resolve(payment);
      });
    });
  }

  async refundPayment(request: RefundPaymentRequest): Promise<RefundPaymentResponse> {
    try {
      // First get the payment to find the sale ID
      const payment = await this.getPaymentStatus(request.paymentId);
      const saleId = payment.transactions[0]?.related_resources[0]?.sale?.id;

      if (!saleId) {
        throw new Error('Sale ID not found in payment');
      }

      const refundAmount = request.amount || payment.transactions[0].amount.total;

      const refundData = {
        amount: {
          total: refundAmount.toFixed(2),
          currency: payment.transactions[0].amount.currency,
        },
      };

      return new Promise((resolve, reject) => {
        paypal.sale.refund(saleId, refundData, (error, refund) => {
          if (error) {
            this.logger.error(`PayPal refund error: ${error.message}`, error.stack, 'PayPalService');
            reject(error);
            return;
          }

          resolve({
            refundId: refund.id,
            status: refund.state,
            amount: parseFloat(refund.amount.total),
          });
        });
      });
    } catch (error) {
      this.logger.error(`PayPal refundPayment error: ${error}`, undefined, 'PayPalService');
      throw error;
    }
  }

  verifyWebhookSignature(payload: any, signature: string): boolean {
    // PayPal webhook signature verification
    // This is a simplified version - in production, use PayPal's webhook verification SDK
    try {
      // PayPal webhook verification would go here
      // For now, return true if signature is present
      return !!signature;
    } catch (error) {
      this.logger.error(`PayPal webhook verification error: ${error}`, undefined, 'PayPalService');
      return false;
    }
  }
}

