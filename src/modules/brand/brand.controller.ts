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
} from '@nestjs/common';
import { BrandService } from './brand.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { ParseMongoIdPipe } from 'src/common/pipes';
import { QueryBrandDto } from './dto/query-brand.dto';
import { Roles, User } from 'src/common/decorators';
import { UserDocument, UserRole } from 'src/database/models';
import { RolesGuard } from 'src/common/guards';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { BadRequestException } from '@nestjs/common';
import { unlink } from 'fs/promises';

@Controller('brands')
@UseGuards(RolesGuard)
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

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
  async createBrand(
    @Body() createBrandDto: CreateBrandDto,
    @UploadedFile() file: Express.Multer.File,
    @User('_id') userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('Brand image is required.');
    }
    const brand = await this.brandService.createBrand(createBrandDto, file, userId);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Brand created successfully',
      data: brand,
    };
  }

  @Get()

  @UsePipes(new ValidationPipe({ transform: true }))
  async findAllBrands(@Query() queryDto: QueryBrandDto) {
    const { data, currentPage, totalPages, totalItems } = await this.brandService.findAllBrands(queryDto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Brands retrieved successfully',
      data,
      meta: { currentPage, totalPages, totalItems },
    };
  }

  @Get(':id')

  async findBrandById(@Param('id', ParseMongoIdPipe) id: string) {
    const brand = await this.brandService.findBrandById(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Brand retrieved successfully',
      data: brand,
    };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateBrand(
    @Param('id', ParseMongoIdPipe) id: string,
    @Body() updateDto: UpdateBrandDto,
    @User('_id') userId: string,
  ) {
    const brand = await this.brandService.updateBrand(id, updateDto, userId);
    return {
      statusCode: HttpStatus.OK,
      message: 'Brand updated successfully',
      data: brand,
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
  async updateBrandImage(
    @Param('id', ParseMongoIdPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @User('_id') userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('No image file uploaded.');
    }
    const brand = await this.brandService.updateBrandImage(id, file, userId);
    return {
      statusCode: HttpStatus.OK,
      message: 'Brand image updated successfully',
      data: brand,
    };
  }

  @Patch('soft-delete/:id')
  @Roles(UserRole.ADMIN)
  async softDeleteBrand(@Param('id', ParseMongoIdPipe) id: string, @User('_id') userId: string) {
    const result = await this.brandService.softDeleteBrand(id, userId);
    return {
      statusCode: HttpStatus.OK,
      message: result.message,
    };
  }

  @Patch('restore/:id')
  @Roles(UserRole.ADMIN)
  async restoreBrand(@Param('id', ParseMongoIdPipe) id: string) {
    const result = await this.brandService.restoreBrand(id);
    return {
      statusCode: HttpStatus.OK,
      message: result.message,
    };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async deleteBrand(@Param('id', ParseMongoIdPipe) id: string) {
    const result = await this.brandService.deleteBrand(id);
    return {
      statusCode: HttpStatus.OK,
      message: result.message,
    };
  }
}

