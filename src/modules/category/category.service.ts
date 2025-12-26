import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CategoryRepository, BrandRepository } from 'src/database/repositories';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CategoryDocument } from 'src/database/models';
import { QueryCategoryDto } from './dto/query-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { unlink, mkdir, rename, rmdir } from 'fs/promises'; 
import { join } from 'path';
import * as crypto from 'crypto';
import mongoose from 'mongoose'; 

@Injectable()
export class CategoryService {
  constructor(
    private categoryRepository: CategoryRepository,
    private brandRepository: BrandRepository,
  ) {}

  async createCategory(
    createCategoryDto: CreateCategoryDto,
    file: Express.Multer.File,
    userId: string,
  ): Promise<CategoryDocument> {
    const existingCategory = await this.categoryRepository.findOne({ name: createCategoryDto.name });
    if (existingCategory) {
      if (file) {
        await unlink(file.path);
      }
      throw new BadRequestException('Category with this name already exists');
    }

    if (createCategoryDto.brands && createCategoryDto.brands.length > 0) {
      const uniqueBrands = [...new Set(createCategoryDto.brands.map(id => id.toString()))];
      const existingBrands = await this.brandRepository.find({ _id: { $in: uniqueBrands } });
      if (existingBrands.length !== uniqueBrands.length) {
        if (file) {
          await unlink(file.path);
        }
        throw new BadRequestException('One or more provided brand IDs are invalid or do not exist.');
      }

      (createCategoryDto.brands as any) = uniqueBrands.map(id => new mongoose.Types.ObjectId(id));
    }

    const assetFolderId = crypto.randomUUID();
    const categoryUploadPath = join(process.cwd(), 'uploads', 'categories', assetFolderId);
    await mkdir(categoryUploadPath, { recursive: true });

    const oldFilePath = file.path;
    const newFilePath = join(categoryUploadPath, file.filename);
    await rename(oldFilePath, newFilePath);

    const imageUrl = `/uploads/categories/${assetFolderId}/${file.filename}`;

    const category = await this.categoryRepository.create({
      ...createCategoryDto,
      image: imageUrl,
      assetFolderId: assetFolderId,
      createdBy: userId,
    });

    if (!category) {

      if (file) {
        await unlink(newFilePath);
      }

      await rmdir(categoryUploadPath, { recursive: true }); 
      throw new BadRequestException('Failed to create category');
    }

    return category;
  }

  async findAllCategories(queryDto: QueryCategoryDto): Promise<{ data: CategoryDocument[]; currentPage: number; totalPages: number; totalItems: number }> {
    const { search, page, limit } = queryDto;
    const filter: any = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { slogan: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
      ];
    }

    return this.categoryRepository.paginate(filter, page, limit);
  }

  async findCategoryById(id: string): Promise<CategoryDocument> {
    return this.categoryRepository.findById(id);
  }

  async updateCategory(id: string, updateDto: UpdateCategoryDto, userId: string): Promise<CategoryDocument> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (updateDto.name && updateDto.name !== category.name) {
      const nameExists = await this.categoryRepository.findOne({ name: updateDto.name });
      if (nameExists && nameExists._id.toString() !== id) {
        throw new BadRequestException('Category with this name already exists');
      }
    }

    if (updateDto.brands && updateDto.brands.length > 0) {
      const uniqueBrands = [...new Set(updateDto.brands.map(id => id.toString()))];
      const existingBrands = await this.brandRepository.find({ _id: { $in: uniqueBrands } });
      if (existingBrands.length !== uniqueBrands.length) {
        throw new BadRequestException('One or more provided brand IDs are invalid or do not exist.');
      }

      (updateDto.brands as any) = uniqueBrands.map(id => new mongoose.Types.ObjectId(id));
    }

    const updatePayload: any = { ...updateDto, updatedBy: userId };
    if (!updateDto.image) {
      updatePayload.image = category.image;
    }

    return this.categoryRepository.findByIdAndUpdate(id, updatePayload);
  }

  async updateCategoryImage(id: string, file: Express.Multer.File, userId: string): Promise<CategoryDocument> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      if (file) {
        await unlink(file.path);
      }
      throw new NotFoundException('Category not found');
    }

    const oldImageUrl = category.image;
    const assetFolderId = category.assetFolderId || crypto.randomUUID(); 
    const categoryUploadPath = join(process.cwd(), 'uploads', 'categories', assetFolderId);
    await mkdir(categoryUploadPath, { recursive: true }); 

    const oldFilePath = file.path;
    const newFilePath = join(categoryUploadPath, file.filename);
    await rename(oldFilePath, newFilePath);

    const newImageUrl = `/uploads/categories/${assetFolderId}/${file.filename}`;

    const updatedCategory = await this.categoryRepository.findByIdAndUpdate(
      id,
      { image: newImageUrl, assetFolderId: assetFolderId, updatedBy: userId },
    );

    if (!updatedCategory) {
      if (file) {
        await unlink(newFilePath); 
      }
      throw new BadRequestException('Failed to update category image');
    }

    if (oldImageUrl && oldImageUrl.startsWith('/uploads/categories/') && oldImageUrl !== newImageUrl) {
      const oldImagePath = join(process.cwd(), oldImageUrl); 
      try {
        await unlink(oldImagePath);
      } catch (error) {
        console.error(`Failed to delete old image: ${oldImagePath}`, error);
      }
    }

    return updatedCategory;
  }

  async softDeleteCategory(id: string, userId: string): Promise<{ message: string }> {
    const category = await this.categoryRepository.softDelete(id, userId);
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return { message: 'Category soft deleted successfully' };
  }

  async restoreCategory(id: string): Promise<{ message: string }> {
    const category = await this.categoryRepository.restore(id);
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return { message: 'Category restored successfully' };
  }

  async deleteCategory(id: string): Promise<{ message: string }> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    await this.categoryRepository.deleteById(id);

    if (category.assetFolderId) { 
      const categoryFolderPath = join(process.cwd(), 'uploads', 'categories', category.assetFolderId);
      try {
        await rmdir(categoryFolderPath, { recursive: true });
      } catch (error: any) {
        console.error(`Failed to delete category folder: ${categoryFolderPath}`, error);
      }
    }
    return { message: 'Category hard deleted successfully' };
  }
}

