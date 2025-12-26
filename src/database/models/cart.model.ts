import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Query, Aggregate } from 'mongoose'; 
import { Product } from './product.model';
import { User } from './user.model';

export type CartDocument = Cart & Document;

@Schema()
export class CartProduct {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product', required: true })
  product: MongooseSchema.Types.ObjectId | Product;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ required: true, min: 0 })
  finalPrice: number; 
}

export const CartProductSchema = SchemaFactory.createForClass(CartProduct);

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class Cart {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, unique: true })
  user: MongooseSchema.Types.ObjectId | User;

  @Prop({ type: [CartProductSchema], default: [] })
  products: CartProduct[];

  @Prop({ type: Number, default: 0 })
  subTotal: number;

  @Prop({ type: Date, default: null })
  softDeletedAt: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', default: null })
  softDeletedBy: MongooseSchema.Types.ObjectId | User;
}

export const CartSchema = SchemaFactory.createForClass(Cart);

CartSchema.pre<CartDocument>('save', function (next) {
  this.subTotal = this.products.reduce(
    (acc, item) => acc + item.quantity * item.finalPrice,
    0,
  );
  next();
});

CartSchema.pre<Query<any, CartDocument>>('findOneAndUpdate', function (next) { 
  const update = this.getUpdate() as any; 
  if (update.$set && update.$set.products) {
    update.$set.subTotal = update.$set.products.reduce(
      (acc: number, item: CartProduct) => acc + item.quantity * item.finalPrice,
      0,
    );
  } else if (update.products) { 
    update.subTotal = update.products.reduce(
      (acc: number, item: CartProduct) => acc + item.quantity * item.finalPrice,
      0,
    );
  }
  next();
});

CartSchema.pre<Query<any, CartDocument>>('find', function (next) { 
  this.where({ softDeletedAt: null });
  next();
});

CartSchema.pre<Query<any, CartDocument>>('findOne', function (next) { 
  this.where({ softDeletedAt: null });
  next();
});

CartSchema.pre<Query<any, CartDocument>>('findOneAndUpdate', function (next) { 
  this.where({ softDeletedAt: null });
  next();
});

CartSchema.pre<Query<any, CartDocument>>('updateMany', function (next) { 
  this.where({ softDeletedAt: null });
  next();
});

CartSchema.pre<Query<any, CartDocument>>('countDocuments', function (next) { 
  this.where({ softDeletedAt: null });
  next();
});

CartSchema.pre<Aggregate<any>>('aggregate', function (next) { 
  (this as any).pipeline().unshift({ $match: { softDeletedAt: null } }); 
  next();
});

