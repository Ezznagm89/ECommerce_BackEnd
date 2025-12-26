import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Query, Aggregate } from 'mongoose'; 
import slugify from 'slugify';
import { User } from './user.model';

export type BrandDocument = Brand & Document;

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class Brand {
  @Prop({ required: true, unique: true, minlength: 3, maxlength: 50, trim: true })
  name: string;

  @Prop({ unique: true })
  slug: string;

  @Prop({ required: true })
  image: string;

  @Prop({ type: String, maxlength: 200 })
  slogan: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  createdBy: MongooseSchema.Types.ObjectId | User;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  updatedBy: MongooseSchema.Types.ObjectId | User;

  @Prop({ type: Date, default: null })
  softDeletedAt: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', default: null })
  softDeletedBy: MongooseSchema.Types.ObjectId | User;
}

export const BrandSchema = SchemaFactory.createForClass(Brand);

BrandSchema.pre<BrandDocument>('save', function (next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

BrandSchema.pre<Query<any, BrandDocument>>('findOneAndUpdate', function (next) { 
  const update = this.getUpdate() as any; 
  if (update && update.name && typeof update.name === 'string') {
    update.slug = slugify(update.name, { lower: true, strict: true });
  }
  next();
});

BrandSchema.pre<Query<any, BrandDocument>>('find', function (next) { 
  this.where({ softDeletedAt: null });
  next();
});

BrandSchema.pre<Query<any, BrandDocument>>('findOne', function (next) { 
  this.where({ softDeletedAt: null });
  next();
});

BrandSchema.pre<Query<any, BrandDocument>>('findOneAndUpdate', function (next) { 
  this.where({ softDeletedAt: null });
  next();
});

BrandSchema.pre<Query<any, BrandDocument>>('updateMany', function (next) { 
  this.where({ softDeletedAt: null });
  next();
});

BrandSchema.pre<Query<any, BrandDocument>>('countDocuments', function (next) { 
  this.where({ softDeletedAt: null });
  next();
});

BrandSchema.pre<Aggregate<any>>('aggregate', function (next) { 
  (this as any).pipeline().unshift({ $match: { softDeletedAt: null } }); 
  next();
});

