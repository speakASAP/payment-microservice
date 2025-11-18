/**
 * Webhooks Controller
 */

import { Controller, Post, Body, Headers, HttpException, HttpStatus, RawBodyRequest, Req } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { Request } from 'express';

@Controller('webhooks')
export class WebhooksController {
  constructor(private webhooksService: WebhooksService) {}

  @Post('paypal')
  async handlePayPal(@Body() payload: any, @Headers('x-paypal-signature') signature: string) {
    try {
      await this.webhooksService.handlePayPalWebhook(payload, signature);
      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException(
        {
          success: false,
          error: 'WEBHOOK_PROCESSING_FAILED',
          message: errorMessage,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('stripe')
  async handleStripe(@Req() req: RawBodyRequest<Request>, @Headers('stripe-signature') signature: string) {
    try {
      const payload = req.body;
      await this.webhooksService.handleStripeWebhook(payload, signature);
      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException(
        {
          success: false,
          error: 'WEBHOOK_PROCESSING_FAILED',
          message: errorMessage,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('payu')
  async handlePayU(@Body() payload: any, @Headers('openpayu-signature') signature: string) {
    try {
      await this.webhooksService.handlePayUWebhook(payload, signature);
      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException(
        {
          success: false,
          error: 'WEBHOOK_PROCESSING_FAILED',
          message: errorMessage,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('fiobanka')
  async handleFioBanka(@Body() payload: any, @Headers('x-fio-signature') signature: string) {
    try {
      await this.webhooksService.handleFioBankaWebhook(payload, signature);
      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException(
        {
          success: false,
          error: 'WEBHOOK_PROCESSING_FAILED',
          message: errorMessage,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('comgate')
  async handleComGate(@Body() payload: any, @Headers('x-comgate-signature') signature: string) {
    try {
      await this.webhooksService.handleComGateWebhook(payload, signature);
      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException(
        {
          success: false,
          error: 'WEBHOOK_PROCESSING_FAILED',
          message: errorMessage,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}

