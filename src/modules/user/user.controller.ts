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
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ParseMongoIdPipe } from 'src/common/pipes';
import { QueryUserDto } from './dto/query-user.dto';
import { Roles, User } from 'src/common/decorators';
import { UserDocument, UserRole } from 'src/database/models';
import { RolesGuard } from 'src/common/guards';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { unlink } from 'fs/promises'; 

@Controller('users')
@UseGuards(RolesGuard) 
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Roles(UserRole.ADMIN) 
  @UsePipes(new ValidationPipe({ transform: true }))
  async createUser(@Body() createUserDto: CreateUserDto) {
    const user = await this.userService.createUser(createUserDto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'User created successfully',
      data: user,
    };
  }

  @Get()
  @Roles(UserRole.ADMIN) 
  @UsePipes(new ValidationPipe({ transform: true }))
  async findAllUsers(@Query() queryDto: QueryUserDto) {
    const { data, currentPage, totalPages, totalItems } = await this.userService.findAllUsers(queryDto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Users retrieved successfully',
      data,
      meta: { currentPage, totalPages, totalItems },
    };
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.USER) 
  async findUserById(@Param('id', ParseMongoIdPipe) id: string, @User() currentUser: UserDocument) {
    if (currentUser.role === UserRole.USER && currentUser._id.toString() !== id) {
      throw new ForbiddenException('You are not authorized to view this user profile.');
    }
    const user = await this.userService.findUserById(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'User retrieved successfully',
      data: user,
    };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.USER) 
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateUser(@Param('id', ParseMongoIdPipe) id: string, @Body() updateDto: UpdateUserDto, @User() currentUser: UserDocument) {
    if (currentUser.role === UserRole.USER && currentUser._id.toString() !== id) {
      throw new ForbiddenException('You are not authorized to update this user profile.');
    }
    const user = await this.userService.updateUser(id, updateDto);
    return {
      statusCode: HttpStatus.OK,
      message: 'User updated successfully',
      data: user,
    };
  }

  @Patch('upload-image/:id')
  @Roles(UserRole.ADMIN, UserRole.USER)
  @UseInterceptors(
    FileInterceptor('profileImage', {
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
  async updateUserImage(
    @Param('id', ParseMongoIdPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @User() currentUser: UserDocument,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded.');
    }
    if (currentUser.role === UserRole.USER && currentUser._id.toString() !== id) {

      if (file) {
        await unlink(file.path);
      }
      throw new ForbiddenException('You are not authorized to update this user profile image.');
    }

    const user = await this.userService.findUserById(id);
    const oldImageUrl = user.profileImage; 

    const updatedUser = await this.userService.updateUserProfileImage(id, file, oldImageUrl);
    return {
      statusCode: HttpStatus.OK,
      message: 'Profile image updated successfully',
      data: updatedUser,
    };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN) 
  async deleteUser(@Param('id', ParseMongoIdPipe) id: string) {
    const result = await this.userService.deleteUser(id);
    return {
      statusCode: HttpStatus.OK,
      message: result.message,
    };
  }
}

