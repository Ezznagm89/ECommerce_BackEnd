import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ProductRepository, CategoryRepository, BrandRepository } from 'src/database/repositories';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductDocument, CategoryDocument } from 'src/database/models';
import { QueryProductDto } from './dto/query-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { unlink, mkdir, rename, rmdir } from 'fs/promises'; 
import { join } from 'path';
import * as crypto from 'crypto';
import mongoose from 'mongoose'; 

@Injectable()
export class ProductService {
  constructor(
    private productRepository: ProductRepository,
    private categoryRepository: CategoryRepository,
    private brandRepository: BrandRepository,
  ) {}

  async createProduct(
    createProductDto: CreateProductDto,
    files: { mainImage?: Express.Multer.File[]; subImages?: Express.Multer.File[] },
    userId: string,
  ): Promise<ProductDocument> {
    const { name, category, brand } = createProductDto;

    const existingProduct = await this.productRepository.findOne({ name });
    if (existingProduct) {
      if (files.mainImage) await unlink(files.mainImage[0].path);
      if (files.subImages) {
        for (const file of files.subImages) await unlink(file.path);
      }
      throw new BadRequestException('Product with this name already exists');
    }

    const foundCategory = await this.categoryRepository.findById(category.toString());
    if (!foundCategory) {
      if (files.mainImage) await unlink(files.mainImage[0].path);
      if (files.subImages) {
        for (const file of files.subImages) await unlink(file.path);
      }
      throw new NotFoundException('Category not found');
    }

    const foundBrand = await this.brandRepository.findById(brand.toString());
    if (!foundBrand) {
      if (files.mainImage) await unlink(files.mainImage[0].path);
      if (files.subImages) {
        for (const file of files.subImages) await unlink(file.path);
      }
      throw new NotFoundException('Brand not found');
    }

    if (createProductDto.quantity <= 0) {
      if (files.mainImage) await unlink(files.mainImage[0].path);
      if (files.subImages) {
        for (const file of files.subImages) await unlink(file.path);
      }
      throw new BadRequestException('Product quantity must be greater than zero');
    }

    if (!foundCategory.assetFolderId) {

      throw new BadRequestException('Category asset folder ID is missing. Please update the category.');
    }

    const productFolderPath = join(
      process.cwd(),
      'uploads',
      'products',
      foundCategory.assetFolderId,
    );
    await mkdir(productFolderPath, { recursive: true });

    let mainImageUrl = '';
    if (files.mainImage && files.mainImage.length > 0) {
      const oldPath = files.mainImage[0].path;
      const newPath = join(productFolderPath, files.mainImage[0].filename);
      await rename(oldPath, newPath);
      mainImageUrl = `/uploads/products/${foundCategory.assetFolderId}/${files.mainImage[0].filename}`;
    } else {
      throw new BadRequestException('Main image is required');
    }

    const subImageUrls: string[] = [];
    if (files.subImages && files.subImages.length > 0) {
      for (const file of files.subImages) {
        const oldPath = file.path;
        const newPath = join(productFolderPath, file.filename);
        await rename(oldPath, newPath);
        subImageUrls.push(`/uploads/products/${foundCategory.assetFolderId}/${file.filename}`);
      }
    }

    const product = await this.productRepository.create({
      ...createProductDto,
      mainImage: mainImageUrl,
      subImages: subImageUrls,
      createdBy: userId,
    });

    if (!product) {

      if (mainImageUrl) {
        try {
          await unlink(join(process.cwd(), mainImageUrl)); 
        } catch (error) {
          console.error(`Failed to delete main image: ${mainImageUrl}`, error);
        }
      }
      for (const url of subImageUrls) {
        try {
          await unlink(join(process.cwd(), url)); 
        } catch (error) {
          console.error(`Failed to delete sub image: ${url}`, error);
        }
      }

      try {
        await rmdir(productFolderPath, { recursive: false });
      } catch (error: any) {
        if (error.code === 'ENOTEMPTY') {
          console.warn(`Product folder not empty after failed creation: ${productFolderPath}`);
        } else {
          console.error(`Failed to delete product folder after creation failure: ${productFolderPath}`, error);
        }
      }
      throw new BadRequestException('Failed to create product');
    }

    return product;
  }

  async findAllProducts(queryDto: QueryProductDto): Promise<{ data: ProductDocument[]; currentPage: number; totalPages: number; totalItems: number }> {
    const { search, page, limit, category, brand, minPrice, maxPrice, minRating } = queryDto;
    const filter: any = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
      ];
    }
    if (category) filter.category = category;
    if (brand) filter.brand = brand;
    if (minPrice !== undefined) filter.price = { ...filter.price, $gte: minPrice };
    if (maxPrice !== undefined) filter.price = { ...filter.price, $lte: maxPrice };
    if (minRating !== undefined) filter.ratingsAverage = { ...filter.ratingsAverage, $gte: minRating };

    return this.productRepository.paginate(filter, page, limit, null, null, ['category', 'brand']);
  }

  async findProductById(id: string): Promise<ProductDocument> {
    return this.productRepository.findById(id);
  }

  async updateProduct(id: string, updateDto: UpdateProductDto, userId: string): Promise<ProductDocument> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (updateDto.name && updateDto.name !== product.name) {
      const nameExists = await this.productRepository.findOne({ name: updateDto.name });
      if (nameExists && nameExists._id.toString() !== id) {
        throw new BadRequestException('Product with this name already exists');
      }
    }

    if (updateDto.category && updateDto.category.toString() !== product.category.toString()) {
      const foundCategory = await this.categoryRepository.findById(updateDto.category.toString());
      if (!foundCategory) {
        throw new NotFoundException('Category not found');
      }
    }

    if (updateDto.brand && updateDto.brand.toString() !== product.brand.toString()) {
      const foundBrand = await this.brandRepository.findById(updateDto.brand.toString());
      if (!foundBrand) {
        throw new NotFoundException('Brand not found');
      }
    }

    if (updateDto.quantity !== undefined && updateDto.quantity < product.sold) {
      throw new BadRequestException('New quantity cannot be less than sold quantity.');
    }

    const updatePayload: any = { ...updateDto, updatedBy: userId };

    return this.productRepository.findByIdAndUpdate(id, updatePayload);
  }

  async updateProductImages(
    id: string,
    files: { mainImage?: Express.Multer.File[]; subImages?: Express.Multer.File[] },
    userId: string,
  ): Promise<ProductDocument> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      if (files.mainImage) await unlink(files.mainImage[0].path);
      if (files.subImages) {
        for (const file of files.subImages) await unlink(file.path);
      }
      throw new NotFoundException('Product not found');
    }

    const category = await this.categoryRepository.findById(product.category.toString());
    if (!category) {
      throw new NotFoundException('Product category not found');
    }

    if (!category.assetFolderId) {
      throw new BadRequestException('Category asset folder ID is missing. Cannot update product images.');
    }

    const productFolderPath = join(
      process.cwd(),
      'uploads',
      'products',
      category.assetFolderId,
    );
    await mkdir(productFolderPath, { recursive: true });

    const updatePayload: any = { updatedBy: userId };
    const oldImageUrls: string[] = [];

    if (files.mainImage && files.mainImage.length > 0) {
      oldImageUrls.push(product.mainImage);
      const oldPath = files.mainImage[0].path;
      const newPath = join(productFolderPath, files.mainImage[0].filename);
      await rename(oldPath, newPath);
      updatePayload.mainImage = `/uploads/products/${category.assetFolderId}/${files.mainImage[0].filename}`;
    }

    if (files.subImages && files.subImages.length > 0) {
      oldImageUrls.push(...product.subImages);
      const newSubImageUrls: string[] = [];
      for (const file of files.subImages) {
        const oldPath = file.path;
        const newPath = join(productFolderPath, file.filename);
        await rename(oldPath, newPath);
        newSubImageUrls.push(`/uploads/products/${category.assetFolderId}/${file.filename}`);
      }
      updatePayload.subImages = newSubImageUrls;
    }

    const updatedProduct = await this.productRepository.findByIdAndUpdate(id, updatePayload);

    if (!updatedProduct) {

      if (files.mainImage) await unlink(join(productFolderPath, files.mainImage[0].filename));
      if (files.subImages) {
        for (const file of files.subImages) await unlink(join(productFolderPath, file.filename));
      }
      throw new BadRequestException('Failed to update product images');
    }

    for (const url of oldImageUrls) {
      if (url && url.startsWith('/uploads/products/')) {
        const imagePath = join(process.cwd(), url); 
        try {
          await unlink(imagePath);
        } catch (error) {
          console.error(`Failed to delete old image: ${imagePath}`, error);
        }
      }
    }

    return updatedProduct;
  }

  async softDeleteProduct(id: string, userId: string): Promise<{ message: string }> {
    const product = await this.productRepository.softDelete(id, userId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return { message: 'Product soft deleted successfully' };
  }

  async restoreProduct(id: string): Promise<{ message: string }> {
    const product = await this.productRepository.restore(id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return { message: 'Product restored successfully' };
  }

  async deleteProduct(id: string): Promise<{ message: string }> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    await this.productRepository.deleteById(id);

    const imageUrls = [product.mainImage, ...product.subImages];
    for (const url of imageUrls) {
      if (url && url.startsWith('/uploads/products/')) {
        const imagePath = join(process.cwd(), url); 
        try {
          await unlink(imagePath);
        } catch (error) {
          console.error(`Failed to delete product image: ${imagePath}`, error);
        }
      }
    }

    if (product.category && (product.category as CategoryDocument).assetFolderId) {
      const categoryId = (product.category as CategoryDocument).assetFolderId;
      const productFolderPath = join(process.cwd(), 'uploads', 'products', categoryId);
      try {
        await rmdir(productFolderPath, { recursive: false }); 
      } catch (error: any) {
        if (error.code === 'ENOTEMPTY') {
          console.warn(`Product folder not empty, skipping deletion: ${productFolderPath}`);
        } else {
          console.error(`Failed to delete product folder: ${productFolderPath}`, error);
        }
      }
    }

    return { message: 'Product hard deleted successfully' };
  }
}

