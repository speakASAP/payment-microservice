/**
 * Payments Controller
 */

import { Controller, Post, Get, Body, Param, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { ApiKeyGuard } from '../security/api-key.guard';

@Controller('payments')
@UseGuards(ApiKeyGuard)
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('create')
  async createPayment(@Body() createPaymentDto: CreatePaymentDto) {
    try {
      const payment = await this.paymentsService.createPayment(createPaymentDto);
      return {
        success: true,
        data: {
          paymentId: payment.id,
          status: payment.status,
          redirectUrl: payment.redirectUrl,
          expiresAt: payment.createdAt, // Could be calculated based on payment method
        },
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException(
        {
          success: false,
          error: 'PAYMENT_CREATION_FAILED',
          message: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':paymentId')
  async getPaymentStatus(@Param('paymentId') paymentId: string) {
    try {
      const payment = await this.paymentsService.getPaymentStatus(paymentId);
      return {
        success: true,
        data: {
          paymentId: payment.id,
          orderId: payment.orderId,
          status: payment.status,
          amount: payment.amount,
          currency: payment.currency,
          paymentMethod: payment.paymentMethod,
          providerTransactionId: payment.providerTransactionId,
          createdAt: payment.createdAt,
          completedAt: payment.completedAt,
        },
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          error: 'PAYMENT_NOT_FOUND',
          message: errorMessage,
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Post(':paymentId/refund')
  async refundPayment(
    @Param('paymentId') paymentId: string,
    @Body() refundDto: RefundPaymentDto,
  ) {
    try {
      const payment = await this.paymentsService.refundPayment(paymentId, refundDto);
      return {
        success: true,
        data: {
          paymentId: payment.id,
          status: payment.status,
          refundedAt: payment.refundedAt,
        },
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException(
        {
          success: false,
          error: 'REFUND_FAILED',
          message: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

