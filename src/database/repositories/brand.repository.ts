import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Brand, BrandDocument } from '../models';
import { BaseRepository } from './base.repository';

@Injectable()
export class BrandRepository extends BaseRepository<BrandDocument> {
  constructor(@InjectModel(Brand.name) private brandModel: Model<BrandDocument>) {
    super(brandModel);
  }
}

