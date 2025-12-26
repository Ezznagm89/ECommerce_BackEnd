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
  ForbiddenException,
} from '@nestjs/common';
import { CouponService } from './coupon.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { ParseMongoIdPipe } from 'src/common/pipes';
import { QueryCouponDto } from './dto/query-coupon.dto';
import { Roles, User } from 'src/common/decorators';
import { UserDocument, UserRole } from 'src/database/models';
import { RolesGuard } from 'src/common/guards';

@Controller('coupons')
@UseGuards(RolesGuard)
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @UsePipes(new ValidationPipe({ transform: true }))
  async createCoupon(@Body() createCouponDto: CreateCouponDto, @User('_id') userId: string) {
    const coupon = await this.couponService.createCoupon(createCouponDto, userId);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Coupon created successfully',
      data: coupon,
    };
  }

  @Get()
  @Roles(UserRole.ADMIN) 
  @UsePipes(new ValidationPipe({ transform: true }))
  async findAllCoupons(@Query() queryDto: QueryCouponDto) {
    const { data, currentPage, totalPages, totalItems } = await this.couponService.findAllCoupons(queryDto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Coupons retrieved successfully',
      data,
      meta: { currentPage, totalPages, totalItems },
    };
  }

  @Get(':id')
  @Roles(UserRole.ADMIN) 
  async findCouponById(@Param('id', ParseMongoIdPipe) id: string) {
    const coupon = await this.couponService.findCouponById(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Coupon retrieved successfully',
      data: coupon,
    };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateCoupon(
    @Param('id', ParseMongoIdPipe) id: string,
    @Body() updateDto: UpdateCouponDto,
    @User('_id') userId: string,
  ) {
    const coupon = await this.couponService.updateCoupon(id, updateDto, userId);
    return {
      statusCode: HttpStatus.OK,
      message: 'Coupon updated successfully',
      data: coupon,
    };
  }

  @Patch('soft-delete/:id')
  @Roles(UserRole.ADMIN)
  async softDeleteCoupon(@Param('id', ParseMongoIdPipe) id: string, @User('_id') userId: string) {
    const result = await this.couponService.softDeleteCoupon(id, userId);
    return {
      statusCode: HttpStatus.OK,
      message: result.message,
    };
  }

  @Patch('restore/:id')
  @Roles(UserRole.ADMIN)
  async restoreCoupon(@Param('id', ParseMongoIdPipe) id: string) {
    const result = await this.couponService.restoreCoupon(id);
    return {
      statusCode: HttpStatus.OK,
      message: result.message,
    };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async deleteCoupon(@Param('id', ParseMongoIdPipe) id: string) {
    const result = await this.couponService.deleteCoupon(id);
    return {
      statusCode: HttpStatus.OK,
      message: result.message,
    };
  }
}

