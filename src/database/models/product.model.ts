import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Query, Aggregate } from 'mongoose'; 
import slugify from 'slugify';
import { User } from './user.model';
import { Category } from './category.model';
import { Brand } from './brand.model';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class Product {
  @Prop({ required: true, minlength: 3, maxlength: 500, trim: true })
  name: string;

  @Prop({ unique: true })
  slug: string;

  @Prop({ required: true, minlength: 10, maxlength: 10000 })
  description: string;

  @Prop({ required: true })
  mainImage: string;

  @Prop({ type: [String], default: [] })
  subImages: string[];

  @Prop({ required: true, min: 0 })
  price: number; 

  @Prop({ min: 0, max: 100, default: 0 })
  discount: number; 

  @Prop({ min: 0, default: 0 })
  quantity: number;

  @Prop({ min: 0, default: 0 })
  sold: number;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Category', required: true })
  category: MongooseSchema.Types.ObjectId | Category;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Brand', required: true })
  brand: MongooseSchema.Types.ObjectId | Brand;

  @Prop({ min: 0, max: 5, default: 0 })
  ratingsAverage: number;

  @Prop({ default: 0 })
  ratingsQuantity: number;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  createdBy: MongooseSchema.Types.ObjectId | User;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  updatedBy: MongooseSchema.Types.ObjectId | User;

  @Prop({ type: Date, default: null })
  softDeletedAt: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', default: null })
  softDeletedBy: MongooseSchema.Types.ObjectId | User;

  stock: number;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

ProductSchema.virtual('stock').get(function () {
  return this.quantity - this.sold;
});

ProductSchema.pre<ProductDocument>('save', function (next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  if (this.isModified('price') || this.isModified('discount')) {

    const currentPrice = this.price;
    const currentDiscount = this.discount;
    if (currentDiscount > 0) {
      this.price = currentPrice * (1 - currentDiscount / 100);
    }
  }
  next();
});

ProductSchema.pre<Query<any, ProductDocument>>('findOneAndUpdate', function (next) { 
  const update = this.getUpdate() as any;
  if (update && update.name && typeof update.name === 'string') {
    update.slug = slugify(update.name, { lower: true, strict: true });
  }

  if (
    (update && update.price !== undefined) ||
    (update && update.discount !== undefined)
  ) {

    const originalPrice = update.price !== undefined ? update.price : this.get('price');
    const originalDiscount = update.discount !== undefined ? update.discount : this.get('discount');

    if (originalDiscount > 0) {
      update.price = originalPrice * (1 - originalDiscount / 100);
    } else {
      update.price = originalPrice;
    }
  }
  next();
});

ProductSchema.pre<Query<any, ProductDocument>>('find', function (next) { 
  this.where({ softDeletedAt: null });
  next();
});

ProductSchema.pre<Query<any, ProductDocument>>('findOne', function (next) { 
  this.where({ softDeletedAt: null });
  next();
});

ProductSchema.pre<Query<any, ProductDocument>>('findOneAndUpdate', function (next) { 
  this.where({ softDeletedAt: null });
  next();
});

ProductSchema.pre<Query<any, ProductDocument>>('updateMany', function (next) { 
  this.where({ softDeletedAt: null });
  next();
});

ProductSchema.pre<Query<any, ProductDocument>>('countDocuments', function (next) { 
  this.where({ softDeletedAt: null });
  next();
});

ProductSchema.pre<Aggregate<any>>('aggregate', function (next) { 
  (this as any).pipeline().unshift({ $match: { softDeletedAt: null } }); 
  next();
});

