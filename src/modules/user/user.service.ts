import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from 'src/database/repositories';
import { CreateUserDto } from './dto/create-user.dto';
import { UserDocument } from 'src/database/models';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { UpdateUserImageDto } from './dto/update-user-image.dto';
import { unlink } from 'fs/promises'; 

@Injectable()
export class UserService {
  constructor(private userRepository: UserRepository) {}

  async createUser(createUserDto: CreateUserDto): Promise<UserDocument> {
    const existingUser = await this.userRepository.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }
    return this.userRepository.create(createUserDto);
  }

  async findAllUsers(queryDto: QueryUserDto): Promise<{ data: UserDocument[]; currentPage: number; totalPages: number; totalItems: number }> {
    const { search, page, limit } = queryDto;
    const filter: any = {};

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    return this.userRepository.paginate(filter, page, limit);
  }

  async findUserById(id: string): Promise<UserDocument> {
    return this.userRepository.findById(id);
  }

  async updateUser(id: string, updateDto: UpdateUserDto): Promise<UserDocument> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (updateDto.email && updateDto.email !== user.email) {
      const emailExists = await this.userRepository.findByEmail(updateDto.email);
      if (emailExists && emailExists._id.toString() !== id) {
        throw new BadRequestException('Email already in use by another user');
      }
    }

    return this.userRepository.findByIdAndUpdate(id, updateDto);
  }

  async updateUserProfileImage(id: string, file: Express.Multer.File, oldImageUrl?: string): Promise<UserDocument> {
    const user = await this.userRepository.findById(id);
    if (!user) {

      if (file) {
        await unlink(file.path);
      }
      throw new NotFoundException('User not found');
    }

    const imageUrl = `/uploads/${file.filename}`;

    const updatedUser = await this.userRepository.findByIdAndUpdate(id, { profileImage: imageUrl });

    if (oldImageUrl && oldImageUrl.startsWith('/uploads/') && oldImageUrl !== imageUrl) { 
      const oldImagePath = `./uploads/${oldImageUrl.split('/uploads/')[1]}`;
      try {
        await unlink(oldImagePath);
      } catch (error) {
        console.error(`Failed to delete old image: ${oldImagePath}`, error);
      }
    }

    return updatedUser;
  }

  async deleteUser(id: string): Promise<{ message: string }> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.userRepository.deleteById(id);

    if (user.profileImage && user.profileImage.startsWith('/uploads/')) {
      const imagePath = `./uploads/${user.profileImage.split('/uploads/')[1]}`;
      try {
        await unlink(imagePath);
      } catch (error) {
        console.error(`Failed to delete user profile image: ${imagePath}`, error);
      }
    }
    return { message: 'User deleted successfully' };
  }
}

