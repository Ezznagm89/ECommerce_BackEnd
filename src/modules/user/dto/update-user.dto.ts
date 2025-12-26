import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { AtLeastOneProperty } from 'src/common/decorators';
import { IsOptional, IsString, IsBoolean } from 'class-validator';

@AtLeastOneProperty(
  ['firstName', 'lastName', 'email', 'phone', 'address', 'gender', 'isEmailVerified', 'profileImage'], 
  { message: 'At least one field must be provided for update' },
)
export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional()
  @IsString({ message: 'Profile image URL must be a string' })
  profileImage?: string;

  @IsOptional()
  @IsBoolean({ message: 'isEmailVerified must be a boolean' })
  isEmailVerified?: boolean;
}

