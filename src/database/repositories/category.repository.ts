import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from '../models';
import { BaseRepository } from './base.repository';

@Injectable()
export class CategoryRepository extends BaseRepository<CategoryDocument> {
  constructor(@InjectModel(Category.name) private categoryModel: Model<CategoryDocument>) {
    super(categoryModel);
  }
}

