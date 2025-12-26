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
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartQuantityDto } from './dto/update-cart-quantity.dto';
import { ParseMongoIdPipe } from 'src/common/pipes';
import { User, Roles } from 'src/common/decorators'; 
import { UserDocument, UserRole } from 'src/database/models';
import { RolesGuard } from 'src/common/guards';

@Controller('cart')
@UseGuards(RolesGuard) 
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get('my-cart')
  @Roles(UserRole.USER) 
  @UsePipes(new ValidationPipe({ transform: true }))
  async getMyCart(@User('_id') userId: string) {
    const cart = await this.cartService.getMyCart(userId);
    return {
      statusCode: HttpStatus.OK,
      message: 'Cart retrieved successfully',
      data: cart,
    };
  }

  @Post('add')
  @Roles(UserRole.USER)
  @UsePipes(new ValidationPipe({ transform: true }))
  async addToCart(@User('_id') userId: string, @Body() addToCartDto: AddToCartDto) {
    const cart = await this.cartService.addToCart(userId, addToCartDto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Product added to cart successfully',
      data: cart,
    };
  }

  @Patch('update-quantity/:productId')
  @Roles(UserRole.USER)
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateCartProductQuantity(
    @User('_id') userId: string,
    @Param('productId', ParseMongoIdPipe) productId: string,
    @Body() updateCartQuantityDto: UpdateCartQuantityDto,
  ) {
    const cart = await this.cartService.updateCartProductQuantity(
      userId,
      productId,
      updateCartQuantityDto,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Product quantity updated in cart successfully',
      data: cart,
    };
  }

  @Delete('remove/:productId')
  @Roles(UserRole.USER)
  async removeProductFromCart(
    @User('_id') userId: string,
    @Param('productId', ParseMongoIdPipe) productId: string,
  ) {
    const cart = await this.cartService.removeProductFromCart(userId, productId);
    return {
      statusCode: HttpStatus.OK,
      message: 'Product removed from cart successfully',
      data: cart,
    };
  }

  @Delete('clear')
  @Roles(UserRole.USER)
  async clearCart(@User('_id') userId: string) {
    const cart = await this.cartService.clearCart(userId);
    return {
      statusCode: HttpStatus.OK,
      message: 'Cart cleared successfully',
      data: cart,
    };
  }
}

