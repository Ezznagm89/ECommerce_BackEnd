import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Query, Aggregate } from 'mongoose'; 
import * as bcrypt from 'bcryptjs';

export interface UserDocument extends User, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ type: String, enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Prop({ type: String })
  address: string;

  @Prop({ type: String })
  gender: string;

  @Prop({ type: Date })
  dateOfBirth: Date;

  @Prop({ type: String })
  profileImage: string;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Product' }] })
  wishlist: MongooseSchema.Types.ObjectId[];

  @Prop({ type: Date, default: null })
  softDeletedAt: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', default: null })
  softDeletedBy: MongooseSchema.Types.ObjectId | User;

  fullName: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

UserSchema.pre<UserDocument>('save', async function (next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

UserSchema.pre<Query<any, UserDocument>>('find', function (next) { 
  this.where({ softDeletedAt: null });
  next();
});

UserSchema.pre<Query<any, UserDocument>>('findOne', function (next) { 
  this.where({ softDeletedAt: null });
  next();
});

UserSchema.pre<Query<any, UserDocument>>('findOneAndUpdate', function (next) { 
  this.where({ softDeletedAt: null });
  next();
});

UserSchema.pre<Query<any, UserDocument>>('updateMany', function (next) { 
  this.where({ softDeletedAt: null });
  next();
});

UserSchema.pre<Query<any, UserDocument>>('countDocuments', function (next) { 
  this.where({ softDeletedAt: null });
  next();
});

UserSchema.pre<Aggregate<any>>('aggregate', function (next) { 
  (this as any).pipeline().unshift({ $match: { softDeletedAt: null } }); 
  next();
});

UserSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

