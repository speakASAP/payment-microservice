/**
 * Webhooks Service
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentsService } from '../payments/payments.service';
import { PaymentProviderFactory } from '../payments/providers/payment-provider.factory';
import { Payment } from '../payments/entities/payment.entity';
import { PaymentStatus } from '../payments/entities/payment.entity';
import { LoggerService } from '../../shared/logger/logger.service';

@Injectable()
export class WebhooksService {
  constructor(
    private paymentsService: PaymentsService,
    private providerFactory: PaymentProviderFactory,
    private logger: LoggerService,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
  ) {}

  async handlePayPalWebhook(payload: any, signature: string): Promise<void> {
    try {
      const provider = this.providerFactory.getProvider('paypal' as any);
      if (!provider.verifyWebhookSignature(payload, signature)) {
        throw new Error('Invalid PayPal webhook signature');
      }

      // Process PayPal webhook
      if (payload.event_type === 'PAYMENT.SALE.COMPLETED' || payload.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
        const providerTransactionId = payload.resource.parent_payment || payload.resource.id;
        // Find payment by providerTransactionId and update status
        const payment = await this.paymentRepository.findOne({
          where: { providerTransactionId },
        });
        if (payment) {
          await this.paymentsService.updatePaymentStatus(
            payment.id,
            PaymentStatus.COMPLETED,
            payload.resource,
          );
        }
      }
    } catch (error) {
      this.logger.error(`PayPal webhook error: ${error}`, undefined, 'WebhooksService');
      throw error;
    }
  }

  async handleStripeWebhook(payload: any, signature: string): Promise<void> {
    try {
      const provider = this.providerFactory.getProvider('stripe' as any);
      if (!provider.verifyWebhookSignature(JSON.stringify(payload), signature)) {
        throw new Error('Invalid Stripe webhook signature');
      }

      // Process Stripe webhook
      if (payload.type === 'payment_intent.succeeded') {
        const paymentIntent = payload.data.object;
        const payment = await this.paymentRepository.findOne({
          where: { providerTransactionId: paymentIntent.id },
        });
        if (payment) {
          await this.paymentsService.updatePaymentStatus(
            payment.id,
            PaymentStatus.COMPLETED,
            paymentIntent,
          );
        }
      } else if (payload.type === 'payment_intent.payment_failed') {
        const paymentIntent = payload.data.object;
        const payment = await this.paymentRepository.findOne({
          where: { providerTransactionId: paymentIntent.id },
        });
        if (payment) {
          await this.paymentsService.updatePaymentStatus(
            payment.id,
            PaymentStatus.FAILED,
            paymentIntent,
          );
        }
      }
    } catch (error) {
      this.logger.error(`Stripe webhook error: ${error}`, undefined, 'WebhooksService');
      throw error;
    }
  }

  async handlePayUWebhook(payload: any, signature: string): Promise<void> {
    try {
      const provider = this.providerFactory.getProvider('payu' as any);
      if (!provider.verifyWebhookSignature(payload, signature)) {
        throw new Error('Invalid PayU webhook signature');
      }

      // Process PayU webhook
      if (payload.order && payload.order.status === 'COMPLETED') {
        const payment = await this.paymentRepository.findOne({
          where: { providerTransactionId: payload.order.orderId },
        });
        if (payment) {
          await this.paymentsService.updatePaymentStatus(
            payment.id,
            PaymentStatus.COMPLETED,
            payload.order,
          );
        }
      } else if (payload.order && payload.order.status === 'CANCELED') {
        const payment = await this.paymentRepository.findOne({
          where: { providerTransactionId: payload.order.orderId },
        });
        if (payment) {
          await this.paymentsService.updatePaymentStatus(
            payment.id,
            PaymentStatus.CANCELLED,
            payload.order,
          );
        }
      }
    } catch (error) {
      this.logger.error(`PayU webhook error: ${error}`, undefined, 'WebhooksService');
      throw error;
    }
  }

  async handleFioBankaWebhook(payload: any, signature: string): Promise<void> {
    try {
      const provider = this.providerFactory.getProvider('fiobanka' as any);
      if (!provider.verifyWebhookSignature(payload, signature)) {
        throw new Error('Invalid Fio Banka webhook signature');
      }

      // Process Fio Banka webhook
      if (payload.status === 'completed' && payload.paymentId) {
        const payment = await this.paymentRepository.findOne({
          where: { providerTransactionId: payload.paymentId },
        });
        if (payment) {
          await this.paymentsService.updatePaymentStatus(
            payment.id,
            PaymentStatus.COMPLETED,
            payload,
          );
        }
      }
    } catch (error) {
      this.logger.error(`Fio Banka webhook error: ${error}`, undefined, 'WebhooksService');
      throw error;
    }
  }

  async handleComGateWebhook(payload: any, signature: string): Promise<void> {
    try {
      const provider = this.providerFactory.getProvider('comgate' as any);
      if (!provider.verifyWebhookSignature(payload, signature)) {
        throw new Error('Invalid ComGate webhook signature');
      }

      // Process ComGate webhook
      if (payload.status === 'PAID' && payload.transId) {
        const payment = await this.paymentRepository.findOne({
          where: { providerTransactionId: payload.transId },
        });
        if (payment) {
          await this.paymentsService.updatePaymentStatus(
            payment.id,
            PaymentStatus.COMPLETED,
            payload,
          );
        }
      } else if (payload.status === 'CANCELLED' && payload.transId) {
        const payment = await this.paymentRepository.findOne({
          where: { providerTransactionId: payload.transId },
        });
        if (payment) {
          await this.paymentsService.updatePaymentStatus(
            payment.id,
            PaymentStatus.CANCELLED,
            payload,
          );
        }
      }
    } catch (error) {
      this.logger.error(`ComGate webhook error: ${error}`, undefined, 'WebhooksService');
      throw error;
    }
  }
}

