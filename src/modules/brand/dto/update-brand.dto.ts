import { PartialType } from '@nestjs/mapped-types';
import { CreateBrandDto } from './create-brand.dto';
import { AtLeastOneProperty } from 'src/common/decorators';
import { IsOptional, IsString } from 'class-validator';

@AtLeastOneProperty(['name', 'slogan'], {
  message: 'At least one of name or slogan must be provided for update',
})
export class UpdateBrandDto extends PartialType(CreateBrandDto) {
  @IsOptional()
  @IsString({ message: 'Image URL must be a string' })
  image?: string;
}

