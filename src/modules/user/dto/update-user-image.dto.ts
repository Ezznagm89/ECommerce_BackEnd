import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateUserImageDto {
  @IsString({ message: 'Image URL must be a string' })
  @IsNotEmpty({ message: 'Image URL is required' })
  profileImage: string;
}

