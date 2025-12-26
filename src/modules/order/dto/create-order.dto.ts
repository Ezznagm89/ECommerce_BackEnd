import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';
import { PaymentMethod } from 'src/common/enums';

export class CreateOrderDto {
  @IsString({ message: 'Address must be a string' })
  @IsNotEmpty({ message: 'Address is required' })
  address: string;

  @IsString({ message: 'Phone must be a string' })
  @IsNotEmpty({ message: 'Phone number is required' })
  phone: string;

  @IsEnum(PaymentMethod, { message: 'Invalid payment method' })
  @IsNotEmpty({ message: 'Payment method is required' })
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsString({ message: 'Coupon code must be a string' })
  couponCode?: string;
}

