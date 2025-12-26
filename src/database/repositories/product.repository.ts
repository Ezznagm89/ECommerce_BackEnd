import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from '../models';
import { BaseRepository } from './base.repository';

@Injectable()
export class ProductRepository extends BaseRepository<ProductDocument> {
  constructor(@InjectModel(Product.name) private productModel: Model<ProductDocument>) {
    super(productModel);
  }
}

