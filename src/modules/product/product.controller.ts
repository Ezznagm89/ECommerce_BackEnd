import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  ForbiddenException,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ParseMongoIdPipe } from 'src/common/pipes';
import { QueryProductDto } from './dto/query-product.dto';
import { Roles, User } from 'src/common/decorators';
import { UserDocument, UserRole } from 'src/database/models';
import { RolesGuard } from 'src/common/guards';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { BadRequestException } from '@nestjs/common';
import { unlink } from 'fs/promises';

@Controller('products')
@UseGuards(RolesGuard)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'mainImage', maxCount: 1 },
        { name: 'subImages', maxCount: 5 },
      ],
      {
        storage: diskStorage({
          destination: './uploads', 
          filename: (req, file, cb) => {
            const randomName = Array(32)
              .fill(null)
              .map(() => Math.round(Math.random() * 16).toString(16))
              .join('');
            return cb(null, `${randomName}${extname(file.originalname)}`);
          },
        }),
        fileFilter: (req, file, cb) => {
          if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new BadRequestException('Only image files are allowed!'), false);
          }
          cb(null, true);
        },
        limits: {
          fileSize: 5 * 1024 * 1024, 
        },
      },
    ),
  )
  @UsePipes(new ValidationPipe({ transform: true }))
  async createProduct(
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles()
    files: { mainImage?: Express.Multer.File[]; subImages?: Express.Multer.File[] },
    @User('_id') userId: string,
  ) {
    if (!files.mainImage || files.mainImage.length === 0) {
      throw new BadRequestException('Main product image is required.');
    }
    const product = await this.productService.createProduct(createProductDto, files, userId);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Product created successfully',
      data: product,
    };
  }

  @Get()

  @UsePipes(new ValidationPipe({ transform: true }))
  async findAllProducts(@Query() queryDto: QueryProductDto) {
    const { data, currentPage, totalPages, totalItems } = await this.productService.findAllProducts(queryDto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Products retrieved successfully',
      data,
      meta: { currentPage, totalPages, totalItems },
    };
  }

  @Get(':id')

  async findProductById(@Param('id', ParseMongoIdPipe) id: string) {
    const product = await this.productService.findProductById(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Product retrieved successfully',
      data: product,
    };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateProduct(
    @Param('id', ParseMongoIdPipe) id: string,
    @Body() updateDto: UpdateProductDto,
    @User('_id') userId: string,
  ) {
    const product = await this.productService.updateProduct(id, updateDto, userId);
    return {
      statusCode: HttpStatus.OK,
      message: 'Product updated successfully',
      data: product,
    };
  }

  @Patch('upload-images/:id')
  @Roles(UserRole.ADMIN)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'mainImage', maxCount: 1 },
        { name: 'subImages', maxCount: 5 },
      ],
      {
        storage: diskStorage({
          destination: './uploads', 
          filename: (req, file, cb) => {
            const randomName = Array(32)
              .fill(null)
              .map(() => Math.round(Math.random() * 16).toString(16))
              .join('');
            return cb(null, `${randomName}${extname(file.originalname)}`);
          },
        }),
        fileFilter: (req, file, cb) => {
          if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new BadRequestException('Only image files are allowed!'), false);
          }
          cb(null, true);
        },
        limits: {
          fileSize: 5 * 1024 * 1024, 
        },
      },
    ),
  )
  async updateProductImages(
    @Param('id', ParseMongoIdPipe) id: string,
    @UploadedFiles()
    files: { mainImage?: Express.Multer.File[]; subImages?: Express.Multer.File[] },
    @User('_id') userId: string,
  ) {
    if (!files.mainImage && !files.subImages) {
      throw new BadRequestException('At least one image file must be uploaded.');
    }
    const product = await this.productService.updateProductImages(id, files, userId);
    return {
      statusCode: HttpStatus.OK,
      message: 'Product images updated successfully',
      data: product,
    };
  }

  @Patch('soft-delete/:id')
  @Roles(UserRole.ADMIN)
  async softDeleteProduct(@Param('id', ParseMongoIdPipe) id: string, @User('_id') userId: string) {
    const result = await this.productService.softDeleteProduct(id, userId);
    return {
      statusCode: HttpStatus.OK,
      message: result.message,
    };
  }

  @Patch('restore/:id')
  @Roles(UserRole.ADMIN)
  async restoreProduct(@Param('id', ParseMongoIdPipe) id: string) {
    const result = await this.productService.restoreProduct(id);
    return {
      statusCode: HttpStatus.OK,
      message: result.message,
    };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async deleteProduct(@Param('id', ParseMongoIdPipe) id: string) {
    const result = await this.productService.deleteProduct(id);
    return {
      statusCode: HttpStatus.OK,
      message: result.message,
    };
  }
}

