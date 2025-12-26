import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateCategoryImageDto {
  @IsString({ message: 'Image URL must be a string' })
  @IsNotEmpty({ message: 'Image URL is required' })
  image: string;
}

