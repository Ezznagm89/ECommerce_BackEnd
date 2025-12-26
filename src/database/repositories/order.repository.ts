import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from '../models';
import { BaseRepository } from './base.repository';

@Injectable()
export class OrderRepository extends BaseRepository<OrderDocument> {
  constructor(@InjectModel(Order.name) private orderModel: Model<OrderDocument>) {
    super(orderModel);
  }
}

