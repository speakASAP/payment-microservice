/**
 * Payments Service
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { PaymentTransaction, TransactionType, TransactionStatus } from './entities/payment-transaction.entity';
import { PaymentProviderFactory } from './providers/payment-provider.factory';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { LoggerService } from '../../shared/logger/logger.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(PaymentTransaction)
    private transactionRepository: Repository<PaymentTransaction>,
    private providerFactory: PaymentProviderFactory,
    private logger: LoggerService,
    private httpService: HttpService,
  ) {}

  async createPayment(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    try {
      // Create payment record
      const payment = this.paymentRepository.create({
        orderId: createPaymentDto.orderId,
        applicationId: createPaymentDto.applicationId,
        amount: createPaymentDto.amount,
        currency: createPaymentDto.currency,
        paymentMethod: createPaymentDto.paymentMethod,
        callbackUrl: createPaymentDto.callbackUrl,
        status: PaymentStatus.PENDING,
        metadata: createPaymentDto.metadata || {},
      });

      await this.paymentRepository.save(payment);

      // Get provider and create payment
      const provider = this.providerFactory.getProvider(createPaymentDto.paymentMethod);
      const providerResponse = await provider.createPayment({
        orderId: createPaymentDto.orderId,
        amount: createPaymentDto.amount,
        currency: createPaymentDto.currency,
        customer: createPaymentDto.customer,
        callbackUrl: createPaymentDto.callbackUrl,
        metadata: createPaymentDto.metadata,
      });

      // Update payment with provider response
      payment.providerTransactionId = providerResponse.providerTransactionId || null;
      payment.redirectUrl = providerResponse.redirectUrl || null;
      payment.status = PaymentStatus.PROCESSING;

      await this.paymentRepository.save(payment);

      // Create transaction record
      const transaction = this.transactionRepository.create({
        paymentId: payment.id,
        transactionType: TransactionType.PAYMENT,
        amount: createPaymentDto.amount,
        status: TransactionStatus.PENDING,
        providerResponse: providerResponse as any,
      });

      await this.transactionRepository.save(transaction);

      this.logger.log(`Payment created: ${payment.id}`, 'PaymentsService');

      return payment;
    } catch (error) {
      this.logger.error(`Failed to create payment: ${error}`, undefined, 'PaymentsService');
      throw error;
    }
  }

  async getPaymentStatus(paymentId: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
      relations: ['transactions'],
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${paymentId} not found`);
    }

    return payment;
  }

  async refundPayment(paymentId: string, refundDto: RefundPaymentDto): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${paymentId} not found`);
    }

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new Error('Only completed payments can be refunded');
    }

    try {
      const provider = this.providerFactory.getProvider(payment.paymentMethod);
      const refundResponse = await provider.refundPayment({
        paymentId: payment.providerTransactionId || paymentId,
        amount: refundDto.amount,
        reason: refundDto.reason,
      });

      // Update payment status
      if (!refundDto.amount || refundDto.amount >= payment.amount) {
        payment.status = PaymentStatus.REFUNDED;
        payment.refundedAt = new Date();
      }

      await this.paymentRepository.save(payment);

      // Create refund transaction
      const transaction = this.transactionRepository.create({
        paymentId: payment.id,
        transactionType: refundDto.amount && refundDto.amount < payment.amount
          ? TransactionType.PARTIAL_REFUND
          : TransactionType.REFUND,
        amount: refundDto.amount || payment.amount,
        status: TransactionStatus.SUCCESS,
        providerResponse: refundResponse as any,
      });

      await this.transactionRepository.save(transaction);

      this.logger.log(`Payment refunded: ${payment.id}`, 'PaymentsService');

      // Notify application
      await this.notifyApplication(payment, 'refunded');

      return payment;
    } catch (error) {
      this.logger.error(`Failed to refund payment: ${error}`, undefined, 'PaymentsService');
      throw error;
    }
  }

  async updatePaymentStatus(
    paymentId: string,
    status: PaymentStatus,
    providerData?: any,
  ): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${paymentId} not found`);
    }

    payment.status = status;

    if (status === PaymentStatus.COMPLETED && !payment.completedAt) {
      payment.completedAt = new Date();
    }

    if (providerData) {
      payment.providerTransactionId = providerData.transactionId || payment.providerTransactionId;
    }

    await this.paymentRepository.save(payment);

    // Update transaction status
    const transaction = await this.transactionRepository.findOne({
      where: { paymentId: payment.id, transactionType: TransactionType.PAYMENT },
      order: { createdAt: 'DESC' },
    });

    if (transaction) {
      transaction.status =
        status === PaymentStatus.COMPLETED
          ? TransactionStatus.SUCCESS
          : status === PaymentStatus.FAILED
          ? TransactionStatus.FAILED
          : TransactionStatus.PENDING;
      transaction.providerResponse = providerData || transaction.providerResponse;
      await this.transactionRepository.save(transaction);
    }

    // Notify application
    if (status === PaymentStatus.COMPLETED || status === PaymentStatus.FAILED) {
      await this.notifyApplication(payment, status);
    }

    return payment;
  }

  private async notifyApplication(payment: Payment, event: string): Promise<void> {
    try {
      const callbackData = {
        paymentId: payment.id,
        orderId: payment.orderId,
        status: payment.status,
        event,
        timestamp: new Date().toISOString(),
      };

      await firstValueFrom(
        this.httpService.post(payment.callbackUrl, callbackData, {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      );

      this.logger.log(`Application notified: ${payment.callbackUrl}`, 'PaymentsService');
    } catch (error) {
      this.logger.error(`Failed to notify application: ${error}`, undefined, 'PaymentsService');
      // Don't throw - notification failure shouldn't break payment processing
    }
  }
}

