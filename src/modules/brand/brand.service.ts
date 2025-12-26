import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BrandRepository } from 'src/database/repositories';
import { CreateBrandDto } from './dto/create-brand.dto';
import { BrandDocument } from 'src/database/models';
import { QueryBrandDto } from './dto/query-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { unlink } from 'fs/promises';
import { StripeService } from '../stripe/stripe.service'; 
import * as crypto from 'crypto';

@Injectable()
export class BrandService {
  constructor(
    private brandRepository: BrandRepository,

  ) {}

  async createBrand(
    createBrandDto: CreateBrandDto,
    file: Express.Multer.File,
    userId: string,
  ): Promise<BrandDocument> {
    const existingBrand = await this.brandRepository.findOne({ name: createBrandDto.name });
    if (existingBrand) {
      if (file) {
        await unlink(file.path);
      }
      throw new BadRequestException('Brand with this name already exists');
    }

    const imageUrl = `/uploads/${file.filename}`;

    const brand = await this.brandRepository.create({
      ...createBrandDto,
      image: imageUrl,
      createdBy: userId,
    });

    if (!brand) {
      if (file) {
        await unlink(file.path);
      }
      throw new BadRequestException('Failed to create brand');
    }

    return brand;
  }

  async findAllBrands(queryDto: QueryBrandDto): Promise<{ data: BrandDocument[]; currentPage: number; totalPages: number; totalItems: number }> {
    const { search, page, limit } = queryDto;
    const filter: any = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { slogan: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
      ];
    }

    return this.brandRepository.paginate(filter, page, limit);
  }

  async findBrandById(id: string): Promise<BrandDocument> {
    return this.brandRepository.findById(id);
  }

  async updateBrand(id: string, updateDto: UpdateBrandDto, userId: string): Promise<BrandDocument> {
    const brand = await this.brandRepository.findById(id);
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    if (updateDto.name && updateDto.name !== brand.name) {
      const nameExists = await this.brandRepository.findOne({ name: updateDto.name });
      if (nameExists && nameExists._id.toString() !== id) {
        throw new BadRequestException('Brand with this name already exists');
      }
    }

    const updatePayload: any = { ...updateDto, updatedBy: userId };
    if (!updateDto.image) {
      updatePayload.image = brand.image;
    }

    return this.brandRepository.findByIdAndUpdate(id, updatePayload);
  }

  async updateBrandImage(id: string, file: Express.Multer.File, userId: string): Promise<BrandDocument> {
    const brand = await this.brandRepository.findById(id);
    if (!brand) {
      if (file) {
        await unlink(file.path);
      }
      throw new NotFoundException('Brand not found');
    }

    const oldImageUrl = brand.image;
    const newImageUrl = `/uploads/${file.filename}`;

    const updatedBrand = await this.brandRepository.findByIdAndUpdate(
      id,
      { image: newImageUrl, updatedBy: userId },
    );

    if (!updatedBrand) {
      if (file) {
        await unlink(file.path); 
      }
      throw new BadRequestException('Failed to update brand image');
    }

    if (oldImageUrl && oldImageUrl.startsWith('/uploads/') && oldImageUrl !== newImageUrl) {
      const oldImagePath = `./uploads/${oldImageUrl.split('/uploads/')[1]}`;
      try {
        await unlink(oldImagePath);
      } catch (error) {
        console.error(`Failed to delete old image: ${oldImagePath}`, error);
      }
    }

    return updatedBrand;
  }

  async softDeleteBrand(id: string, userId: string): Promise<{ message: string }> {
    const brand = await this.brandRepository.softDelete(id, userId);
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }
    return { message: 'Brand soft deleted successfully' };
  }

  async restoreBrand(id: string): Promise<{ message: string }> {
    const brand = await this.brandRepository.restore(id);
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }
    return { message: 'Brand restored successfully' };
  }

  async deleteBrand(id: string): Promise<{ message: string }> {
    const brand = await this.brandRepository.findById(id);
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }
    await this.brandRepository.deleteById(id);

    if (brand.image && brand.image.startsWith('/uploads/')) {
      const imagePath = `./uploads/${brand.image.split('/uploads/')[1]}`;
      try {
        await unlink(imagePath);
      } catch (error) {
        console.error(`Failed to delete brand image: ${imagePath}`, error);
      }
    }
    return { message: 'Brand hard deleted successfully' };
  }
}

