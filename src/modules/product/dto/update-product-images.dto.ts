import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateProductImagesDto {
  @IsOptional()
  @IsString({ message: 'Main image URL must be a string' })
  @IsNotEmpty({ message: 'Main image URL is required if provided' })
  mainImage?: string;

  @IsOptional()
  @IsString({ each: true, message: 'Sub-images must be an array of strings' })
  @IsNotEmpty({ message: 'Sub-images are required if provided' })
  subImages?: string[];
}

