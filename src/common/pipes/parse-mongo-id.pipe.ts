import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import mongoose from 'mongoose';

@Injectable()
export class ParseMongoIdPipe implements PipeTransform<string, mongoose.Types.ObjectId> {
  transform(value: string): mongoose.Types.ObjectId {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      throw new BadRequestException('Invalid MongoDB ID');
    }
    return new mongoose.Types.ObjectId(value);
  }
}

