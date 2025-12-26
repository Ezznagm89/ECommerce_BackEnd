import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Coupon, CouponDocument } from '../models';
import { BaseRepository } from './base.repository';

@Injectable()
export class CouponRepository extends BaseRepository<CouponDocument> {
  constructor(@InjectModel(Coupon.name) private couponModel: Model<CouponDocument>) {
    super(couponModel);
  }
}

