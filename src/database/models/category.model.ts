import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Query, Aggregate } from 'mongoose'; 
import slugify from 'slugify';
import { User } from './user.model';
import { Brand } from './brand.model';

export type CategoryDocument = Category & Document;

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class Category {
  @Prop({ required: true, unique: true, minlength: 3, maxlength: 50, trim: true })
  name: string;

  @Prop({ unique: true })
  slug: string;

  @Prop({ required: true })
  image: string;

  @Prop({ type: String, maxlength: 200 })
  slogan: string;

  @Prop({ type: String })
  assetFolderId: string; 

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Brand' }] })
  brands: MongooseSchema.Types.ObjectId[] | Brand[];

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  createdBy: MongooseSchema.Types.ObjectId | User;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  updatedBy: MongooseSchema.Types.ObjectId | User;

  @Prop({ type: Date, default: null })
  softDeletedAt: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', default: null })
  softDeletedBy: MongooseSchema.Types.ObjectId | User;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

CategorySchema.pre<CategoryDocument>('save', function (next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

CategorySchema.pre<Query<any, CategoryDocument>>('findOneAndUpdate', function (next) { 
  const update = this.getUpdate() as any; 
  if (update && update.name && typeof update.name === 'string') {
    update.slug = slugify(update.name, { lower: true, strict: true });
  }
  next();
});

CategorySchema.pre<Query<any, CategoryDocument>>('find', function (next) { 
  this.where({ softDeletedAt: null });
  next();
});

CategorySchema.pre<Query<any, CategoryDocument>>('findOne', function (next) { 
  this.where({ softDeletedAt: null });
  next();
});

CategorySchema.pre<Query<any, CategoryDocument>>('findOneAndUpdate', function (next) { 
  this.where({ softDeletedAt: null });
  next();
});

CategorySchema.pre<Query<any, CategoryDocument>>('updateMany', function (next) { 
  this.where({ softDeletedAt: null });
  next();
});

CategorySchema.pre<Query<any, CategoryDocument>>('countDocuments', function (next) { 
  this.where({ softDeletedAt: null });
  next();
});

CategorySchema.pre<Aggregate<any>>('aggregate', function (next) { 
  (this as any).pipeline().unshift({ $match: { softDeletedAt: null } }); 
  next();
});

