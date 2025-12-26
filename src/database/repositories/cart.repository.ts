import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cart, CartDocument } from '../models';
import { BaseRepository } from './base.repository';

@Injectable()
export class CartRepository extends BaseRepository<CartDocument> {
  constructor(@InjectModel(Cart.name) private cartModel: Model<CartDocument>) {
    super(cartModel);
  }
}

