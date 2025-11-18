import { IsString, IsNumber, IsEnum, IsObject, IsOptional, IsUrl, Min } from 'class-validator';
import { PaymentMethod } from '../entities/payment.entity';

export class CustomerDto {
  @IsString()
  email: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  phone?: string;
}

export class CreatePaymentDto {
  @IsString()
  orderId: string;

  @IsString()
  applicationId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  currency: string;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsUrl()
  callbackUrl: string;

  @IsObject()
  customer: CustomerDto;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

