import { Model, Document, FilterQuery, UpdateQuery, QueryOptions, PopulateOptions, SortOrder, Query as MongooseQuery } from 'mongoose'; 
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export abstract class BaseRepository<T extends Document> {
  constructor(protected readonly model: Model<T>) {}

  async create(doc: object): Promise<T> {
    const createdEntity = new this.model(doc);
    return createdEntity.save();
  }

  async find(
    entityFilterQuery: FilterQuery<T>,
    projection?: Record<string, unknown>,
    options?: QueryOptions,
  ): Promise<T[]> {
    return this.model.find(entityFilterQuery, projection, options).exec(); 
  }

  async findOne(
    entityFilterQuery: FilterQuery<T>,
    projection?: Record<string, unknown>,
    options?: QueryOptions,
    populate?: PopulateOptions | (string | PopulateOptions)[], 
  ): Promise<T> {
    const query = this.model.findOne(entityFilterQuery, projection, options);
    if (populate) {
      query.populate(populate);
    }
    const document = await query.exec(); 
    if (!document) {
      throw new NotFoundException('Document not found.');
    }
    return document;
  }

  async findById(
    id: string,
    projection?: Record<string, unknown>,
    options?: QueryOptions,
    populate?: PopulateOptions | (string | PopulateOptions)[], 
  ): Promise<T> {
    const query = this.model.findById(id, projection, options);
    if (populate) {
      query.populate(populate);
    }
    const document = await query.exec(); 
    if (!document) {
      throw new NotFoundException('Document not found.');
    }
    return document;
  }

  async findOneAndUpdate(
    entityFilterQuery: FilterQuery<T>,
    updateEntityData: UpdateQuery<T>,
    options?: QueryOptions,
  ): Promise<T> {
    const document = await this.model.findOneAndUpdate(
      entityFilterQuery,
      updateEntityData,
      { new: true, ...options },
    ).exec(); 
    if (!document) {
      throw new NotFoundException('Document not found.');
    }
    return document;
  }

  async findByIdAndUpdate(
    id: string,
    updateEntityData: UpdateQuery<T>,
    options?: QueryOptions,
  ): Promise<T> {
    const document = await this.model.findByIdAndUpdate(
      id,
      updateEntityData,
      { new: true, ...options },
    ).exec(); 
    if (!document) {
      throw new NotFoundException('Document not found.');
    }
    return document;
  }

  async deleteMany(entityFilterQuery: FilterQuery<T>): Promise<boolean> {
    const deleteResult = await this.model.deleteMany(entityFilterQuery).exec(); 
    return deleteResult.deletedCount >= 1;
  }

  async deleteOne(entityFilterQuery: FilterQuery<T>): Promise<boolean> {
    const deleteResult = await this.model.deleteOne(entityFilterQuery).exec(); 
    return deleteResult.deletedCount === 1;
  }

  async deleteById(id: string): Promise<boolean> {
    const deleteResult = await this.model.findByIdAndDelete(id).exec(); 
    return !!deleteResult;
  }

  async exists(entityFilterQuery: FilterQuery<T>): Promise<boolean> {
    return this.model.exists(entityFilterQuery).then((doc) => !!doc);
  }

  async count(entityFilterQuery: FilterQuery<T>): Promise<number> {
    return this.model.countDocuments(entityFilterQuery).exec(); 
  }

  async paginate(
    filter: FilterQuery<T>,
    page: number,
    limit: number,
    projection?: Record<string, unknown>,
    options?: QueryOptions,
    populate?: PopulateOptions | (string | PopulateOptions)[], 
    sort?: string | { [key: string]: SortOrder | { $meta: any; }; } | [string, SortOrder][] 
  ): Promise<{ data: T[]; currentPage: number; totalPages: number; totalItems: number }> {
    const skip = (page - 1) * limit;
    const totalItems = await this.model.countDocuments(filter).exec(); 
    const totalPages = Math.ceil(totalItems / limit);

    let query: MongooseQuery<T[], T> = this.model.find(filter, projection, options).skip(skip).limit(limit);

    if (populate) {
      query = query.populate(populate);
    }

    if (sort) {
      query = query.sort(sort);
    }

    const data = await query.exec();

    return {
      data,
      currentPage: page,
      totalPages,
      totalItems,
    };
  }

  async softDelete(id: string, userId: string): Promise<T> {
    return this.model.findByIdAndUpdate(
      id,
      { softDeletedAt: new Date(), softDeletedBy: userId },
      { new: true }
    ).exec(); 
  }

  async restore(id: string): Promise<T> {
    return this.model.findByIdAndUpdate(
      id,
      { softDeletedAt: null, softDeletedBy: null },
      { new: true }
    ).exec(); 
  }
}

