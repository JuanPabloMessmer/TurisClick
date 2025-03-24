import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { TransactionStatus } from '../entities/transaction.entity';

export class CreateTransactionDto {
  @IsNotEmpty()
  @IsString()
  scrumPayTransactionId: string;

  @IsOptional()
  @IsString()
  scrumPayAuthorizationCode?: string;

  @IsNotEmpty()
  @IsString()
  internalTransactionCode: string;

  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  currency?: string = 'BOB';

  @IsEnum(TransactionStatus)
  status: TransactionStatus;

  @IsOptional()
  @IsString()
  paymentForm?: string;

  @IsOptional()
  @IsString()
  maskedCardNumber?: string;

  @IsOptional()
  @IsString()
  expirationDate?: string;

  @IsOptional()
  @IsString()
  token?: string;

  @IsOptional()
  @IsNumber()
  userId?: number;

  @IsOptional()
  @IsNumber()
  paymentMethodId?: number;

  @IsOptional()
  @IsNumber()
  reservationId?: number;

  @IsOptional()
  additionalData?: Record<string, any>;
}
