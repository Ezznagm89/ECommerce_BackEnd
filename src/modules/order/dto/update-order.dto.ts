import { PartialType } from '@nestjs/mapped-types';
import { CreateOrderDto } from './create-order.dto';
import { AtLeastOneProperty } from 'src/common/decorators';
import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { OrderStatus } from 'src/common/enums';

@AtLeastOneProperty(['address', 'phone', 'paymentMethod', 'couponCode', 'status'], {
  message: 'At least one field must be provided for update',
})
export class UpdateOrderDto extends PartialType(CreateOrderDto) {
  @IsOptional()
  @IsEnum(OrderStatus, { message: 'Invalid order status' })
  status?: OrderStatus;

  @IsOptional()
  @IsString({ message: 'Cancel reason must be a string' })
  cancelReason?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Paid at date must be a valid date string' })
  paidAt?: Date;
}

