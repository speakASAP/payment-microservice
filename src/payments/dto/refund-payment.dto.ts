import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class RefundPaymentDto {
  @IsNumber()
  @IsOptional()
  @Min(0.01)
  amount?: number;

  @IsString()
  @IsOptional()
  reason?: string;
}

