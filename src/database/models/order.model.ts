import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Query, Aggregate } from 'mongoose'; 
import { User } from './user.model';
import { Cart } from './cart.model';
import { Coupon } from './coupon.model';
import { PaymentMethod, OrderStatus } from 'src/common/enums';

export type OrderDocument = Order & Document;

@Schema()
export class OrderPaymentDetails {
  @Prop({ type: String })
  paymentIntentId: string; 

  @Prop({ type: Date })
  paidAt: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  paidBy: MongooseSchema.Types.ObjectId | User;
}

@Schema()
export class OrderStatusDetails {
  @Prop({ type: String, enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Prop({ type: Date })
  cancelledAt: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  cancelledBy: MongooseSchema.Types.ObjectId | User;

  @Prop({ type: String })
  cancelReason: string;

  @Prop({ type: Date })
  refundedAt: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  refundedBy: MongooseSchema.Types.ObjectId | User;
}

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class Order {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: MongooseSchema.Types.ObjectId | User;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Cart', required: true })
  cart: MongooseSchema.Types.ObjectId | Cart;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Coupon' })
  coupon: MongooseSchema.Types.ObjectId | Coupon;

  @Prop({ required: true, min: 0 })
  totalPrice: number; 

  @Prop({ required: true })
  address: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ type: String, enum: PaymentMethod, required: true })
  paymentMethod: PaymentMethod;

  @Prop({ type: Date, default: () => new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) }) 
  estimatedDeliveryDate: Date;

  @Prop({ type: OrderPaymentDetails })
  paymentDetails: OrderPaymentDetails;

  @Prop({ type: OrderStatusDetails, default: {} })
  statusDetails: OrderStatusDetails;

  @Prop({ type: Date, default: null })
  softDeletedAt: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', default: null })
  softDeletedBy: MongooseSchema.Types.ObjectId | User;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

OrderSchema.pre<Query<any, OrderDocument>>('find', function (next) { 
  this.where({ softDeletedAt: null });
  next();
});

OrderSchema.pre<Query<any, OrderDocument>>('findOne', function (next) { 
  this.where({ softDeletedAt: null });
  next();
});

OrderSchema.pre<Query<any, OrderDocument>>('findOneAndUpdate', function (next) { 
  this.where({ softDeletedAt: null });
  next();
});

OrderSchema.pre<Query<any, OrderDocument>>('updateMany', function (next) { 
  this.where({ softDeletedAt: null });
  next();
});

OrderSchema.pre<Query<any, OrderDocument>>('countDocuments', function (next) { 
  this.where({ softDeletedAt: null });
  next();
});

OrderSchema.pre<Aggregate<any>>('aggregate', function (next) { 
  (this as any).pipeline().unshift({ $match: { softDeletedAt: null } }); 
  next();
});

