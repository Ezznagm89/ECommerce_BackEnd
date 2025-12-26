import { IsNotEmpty, IsString, IsNumber, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import mongoose from 'mongoose';

export class AddToCartDto {
  @IsString({ message: 'Product ID must be a string' })
  @IsNotEmpty({ message: 'Product ID is required' })
  productId: mongoose.Types.ObjectId;

  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber({}, { message: 'Quantity must be a number' })
  @Min(1, { message: 'Quantity must be at least 1' })
  @IsNotEmpty({ message: 'Quantity is required' })
  quantity: number;
}

