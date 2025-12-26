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
  UploadedFile,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ParseMongoIdPipe } from 'src/common/pipes';
import { QueryCategoryDto } from './dto/query-category.dto';
import { Roles, User } from 'src/common/decorators';
import { UserDocument, UserRole } from 'src/database/models';
import { RolesGuard } from 'src/common/guards';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { unlink } from 'fs/promises';

@Controller('categories')
@UseGuards(RolesGuard)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @UseInterceptors(
    FileInterceptor('image', {
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
    }),
  )
  @UsePipes(new ValidationPipe({ transform: true }))
  async createCategory(
    @Body() createCategoryDto: CreateCategoryDto,
    @UploadedFile() file: Express.Multer.File,
    @User('_id') userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('Category image is required.');
    }
    const category = await this.categoryService.createCategory(createCategoryDto, file, userId);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Category created successfully',
      data: category,
    };
  }

  @Get()

  @UsePipes(new ValidationPipe({ transform: true }))
  async findAllCategories(@Query() queryDto: QueryCategoryDto) {
    const { data, currentPage, totalPages, totalItems } = await this.categoryService.findAllCategories(queryDto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Categories retrieved successfully',
      data,
      meta: { currentPage, totalPages, totalItems },
    };
  }

  @Get(':id')

  async findCategoryById(@Param('id', ParseMongoIdPipe) id: string) {
    const category = await this.categoryService.findCategoryById(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Category retrieved successfully',
      data: category,
    };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateCategory(
    @Param('id', ParseMongoIdPipe) id: string,
    @Body() updateDto: UpdateCategoryDto,
    @User('_id') userId: string,
  ) {
    const category = await this.categoryService.updateCategory(id, updateDto, userId);
    return {
      statusCode: HttpStatus.OK,
      message: 'Category updated successfully',
      data: category,
    };
  }

  @Patch('upload-image/:id')
  @Roles(UserRole.ADMIN)
  @UseInterceptors(
    FileInterceptor('image', {
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
    }),
  )
  async updateCategoryImage(
    @Param('id', ParseMongoIdPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @User('_id') userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('No image file uploaded.');
    }
    const category = await this.categoryService.updateCategoryImage(id, file, userId);
    return {
      statusCode: HttpStatus.OK,
      message: 'Category image updated successfully',
      data: category,
    };
  }

  @Patch('soft-delete/:id')
  @Roles(UserRole.ADMIN)
  async softDeleteCategory(@Param('id', ParseMongoIdPipe) id: string, @User('_id') userId: string) {
    const result = await this.categoryService.softDeleteCategory(id, userId);
    return {
      statusCode: HttpStatus.OK,
      message: result.message,
    };
  }

  @Patch('restore/:id')
  @Roles(UserRole.ADMIN)
  async restoreCategory(@Param('id', ParseMongoIdPipe) id: string) {
    const result = await this.categoryService.restoreCategory(id);
    return {
      statusCode: HttpStatus.OK,
      message: result.message,
    };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async deleteCategory(@Param('id', ParseMongoIdPipe) id: string) {
    const result = await this.categoryService.deleteCategory(id);
    return {
      statusCode: HttpStatus.OK,
      message: result.message,
    };
  }
}

