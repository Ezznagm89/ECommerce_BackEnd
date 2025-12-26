import { IsNotEmpty, IsString, MinLength, MaxLength, IsNumber, Min, Max, IsDateString } from 'class-validator';

export class CreateCouponDto {
  @IsString({ message: 'Coupon code must be a string' })
  @IsNotEmpty({ message: 'Coupon code is required' })
  @MinLength(3, { message: 'Coupon code must be at least 3 characters long' })
  @MaxLength(50, { message: 'Coupon code cannot exceed 50 characters' })
  code: string;

  @IsNumber({}, { message: 'Amount must be a number' })
  @Min(1, { message: 'Amount must be at least 1%' })
  @Max(100, { message: 'Amount cannot exceed 100%' })
  @IsNotEmpty({ message: 'Amount is required' })
  amount: number;

  @IsDateString({}, { message: 'From date must be a valid date string' })
  @IsNotEmpty({ message: 'From date is required' })
  fromDate: Date;

  @IsDateString({}, { message: 'To date must be a valid date string' })
  @IsNotEmpty({ message: 'To date is required' })
  toDate: Date;
}

