import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Query, Aggregate } from 'mongoose'; 
import { User } from './user.model';

export type CouponDocument = Coupon & Document;

@Schema({ timestamps: true })
export class Coupon {
  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  code: string;

  @Prop({ required: true, min: 1, max: 100 })
  amount: number; 

  @Prop({ required: true })
  fromDate: Date;

  @Prop({ required: true })
  toDate: Date;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }], default: [] })
  usedBy: MongooseSchema.Types.ObjectId[] | User[];

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  createdBy: MongooseSchema.Types.ObjectId | User;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  updatedBy: MongooseSchema.Types.ObjectId | User;

  @Prop({ type: Date, default: null })
  softDeletedAt: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', default: null })
  softDeletedBy: MongooseSchema.Types.ObjectId | User;
}

export const CouponSchema = SchemaFactory.createForClass(Coupon);

CouponSchema.pre<CouponDocument>('save', function (next) {
  if (this.isModified('code')) {
    this.code = this.code.toUpperCase();
  }
  next();
});

CouponSchema.pre<Query<any, CouponDocument>>('find', function (next) { 
  this.where({ softDeletedAt: null });
  next();
});

CouponSchema.pre<Query<any, CouponDocument>>('findOne', function (next) { 
  this.where({ softDeletedAt: null });
  next();
});

CouponSchema.pre<Query<any, CouponDocument>>('findOneAndUpdate', function (next) { 
  this.where({ softDeletedAt: null });
  next();
});

CouponSchema.pre<Query<any, CouponDocument>>('updateMany', function (next) { 
  this.where({ softDeletedAt: null });
  next();
});

CouponSchema.pre<Query<any, CouponDocument>>('countDocuments', function (next) { 
  this.where({ softDeletedAt: null });
  next();
});

CouponSchema.pre<Aggregate<any>>('aggregate', function (next) { 
  (this as any).pipeline().unshift({ $match: { softDeletedAt: null } }); 
  next();
});

