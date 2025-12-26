import { IsNotEmpty, IsString, MinLength, MaxLength, IsOptional } from 'class-validator';

export class CreateBrandDto {
  @IsString({ message: 'Brand name must be a string' })
  @IsNotEmpty({ message: 'Brand name is required' })
  @MinLength(3, { message: 'Brand name must be at least 3 characters long' })
  @MaxLength(50, { message: 'Brand name cannot exceed 50 characters' })
  name: string;

  @IsOptional()
  @IsString({ message: 'Slogan must be a string' })
  @MaxLength(200, { message: 'Slogan cannot exceed 200 characters' })
  slogan?: string;
}

