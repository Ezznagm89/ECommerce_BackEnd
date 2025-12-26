import { IsOptional, IsString, IsNumber, Min, Max, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';

export class QueryCouponDto {
  @IsOptional()
  @IsString({ message: 'Search term must be a string' })
  search?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber({}, { message: 'Page must be a number' })
  @Min(1, { message: 'Page must be at least 1' })
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber({}, { message: 'Limit must be a number' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  limit?: number = 10;

  @IsOptional()
  @IsDateString({}, { message: 'From date must be a valid date string' })
  fromDate?: Date;

  @IsOptional()
  @IsDateString({}, { message: 'To date must be a valid date string' })
  toDate?: Date;
}

