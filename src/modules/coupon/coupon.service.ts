import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CouponRepository } from 'src/database/repositories';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { CouponDocument, UserDocument } from 'src/database/models';
import { QueryCouponDto } from './dto/query-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import mongoose from 'mongoose'; 

@Injectable()
export class CouponService {
  constructor(private couponRepository: CouponRepository) {}

  async createCoupon(createCouponDto: CreateCouponDto, userId: string): Promise<CouponDocument> {
    const { code, fromDate, toDate } = createCouponDto;

    const existingCoupon = await this.couponRepository.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      throw new BadRequestException('Coupon with this code already exists');
    }

    const now = new Date();
    const from = new Date(fromDate);
    const to = new Date(toDate);

    if (from < now) {
      throw new BadRequestException('From date cannot be in the past');
    }
    if (to <= from) {
      throw new BadRequestException('To date must be after from date');
    }

    const coupon = await this.couponRepository.create({
      ...createCouponDto,
      code: code.toUpperCase(),
      createdBy: userId,
    });

    if (!coupon) {
      throw new BadRequestException('Failed to create coupon');
    }
    return coupon;
  }

  async findAllCoupons(queryDto: QueryCouponDto): Promise<{ data: CouponDocument[]; currentPage: number; totalPages: number; totalItems: number }> {
    const { search, page, limit, fromDate, toDate } = queryDto;
    const filter: any = {};

    if (search) {
      filter.$or = [{ code: { $regex: search.toUpperCase(), $options: 'i' } }];
    }
    if (fromDate) filter.fromDate = { $gte: new Date(fromDate) };
    if (toDate) filter.toDate = { ...filter.toDate, $lte: new Date(toDate) };

    return this.couponRepository.paginate(filter, page, limit);
  }

  async findCouponById(id: string): Promise<CouponDocument> {
    return this.couponRepository.findById(id);
  }

  async updateCoupon(id: string, updateDto: UpdateCouponDto, userId: string): Promise<CouponDocument> {
    const coupon = await this.couponRepository.findById(id);
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    if (updateDto.code && updateDto.code.toUpperCase() !== coupon.code) {
      const codeExists = await this.couponRepository.findOne({ code: updateDto.code.toUpperCase() });
      if (codeExists && codeExists._id.toString() !== id) {
        throw new BadRequestException('Coupon with this code already exists');
      }
      updateDto.code = updateDto.code.toUpperCase(); 
    }

    if (updateDto.fromDate || updateDto.toDate) {
      const currentFromDate = updateDto.fromDate ? new Date(updateDto.fromDate) : coupon.fromDate;
      const currentToDate = updateDto.toDate ? new Date(updateDto.toDate) : coupon.toDate;
      const now = new Date();

      if (currentFromDate < now) {
        throw new BadRequestException('From date cannot be in the past');
      }
      if (currentToDate <= currentFromDate) {
        throw new BadRequestException('To date must be after from date');
      }
    }

    return this.couponRepository.findByIdAndUpdate(id, { ...updateDto, updatedBy: userId });
  }

  async softDeleteCoupon(id: string, userId: string): Promise<{ message: string }> {
    const coupon = await this.couponRepository.softDelete(id, userId);
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }
    return { message: 'Coupon soft deleted successfully' };
  }

  async restoreCoupon(id: string): Promise<{ message: string }> {
    const coupon = await this.couponRepository.restore(id);
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }
    return { message: 'Coupon restored successfully' };
  }

  async deleteCoupon(id: string): Promise<{ message: string }> {
    const coupon = await this.couponRepository.deleteById(id);
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }
    return { message: 'Coupon hard deleted successfully' };
  }

  async applyCoupon(code: string, userId: string): Promise<CouponDocument> {
    const coupon = await this.couponRepository.findOne({ code: code.toUpperCase() });
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    const now = new Date();
    if (coupon.fromDate > now || coupon.toDate < now) {
      throw new BadRequestException('Coupon is expired or not yet active');
    }

    if (coupon.usedBy.some(usedById => usedById.toString() === userId)) {
      throw new BadRequestException('Coupon already used by this user');
    }

    return coupon;
  }

  async markCouponAsUsed(couponId: mongoose.Types.ObjectId, userId: string): Promise<CouponDocument> {
    const coupon = await this.couponRepository.findById(couponId.toString()); 
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    if (!coupon.usedBy.some(usedById => usedById.toString() === userId)) {
      (coupon.usedBy as any).push(new mongoose.Types.ObjectId(userId));
      await coupon.save();
    }
    return coupon;
  }
}

