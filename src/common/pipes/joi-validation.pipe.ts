import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';

@Injectable()
export class JoiValidationPipe implements PipeTransform {

  transform(value: any, metadata: ArgumentMetadata) {

    if (!value) {
      throw new BadRequestException('Validation failed: No data provided.');
    }

    return value;
  }
}

