import { PartialType } from '@nestjs/mapped-types';
import { CreateCouponDto } from './create-coupon.dto';
import { AtLeastOneProperty } from 'src/common/decorators';
import { IsNumber, IsOptional, Min, Max, IsDateString, IsString } from 'class-validator';

@AtLeastOneProperty(['code', 'amount', 'fromDate', 'toDate'], {
  message: 'At least one field must be provided for update',
})
export class UpdateCouponDto extends PartialType(CreateCouponDto) {
  @IsOptional()
  @IsString({ message: 'Coupon code must be a string' })
  code?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Amount must be a number' })
  @Min(1, { message: 'Amount must be at least 1%' })
  @Max(100, { message: 'Amount cannot exceed 100%' })
  amount?: number;

  @IsOptional()
  @IsDateString({}, { message: 'From date must be a valid date string' })
  fromDate?: Date;

  @IsOptional()
  @IsDateString({}, { message: 'To date must be a valid date string' })
  toDate?: Date;
}

