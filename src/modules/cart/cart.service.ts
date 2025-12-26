import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CartRepository, ProductRepository } from 'src/database/repositories';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { CartDocument, CartProduct, UserDocument } from 'src/database/models';
import { UpdateCartQuantityDto } from './dto/update-cart-quantity.dto';
import mongoose from 'mongoose'; 

@Injectable()
export class CartService {
  constructor(
    private cartRepository: CartRepository,
    private productRepository: ProductRepository,
  ) {}

  async getMyCart(userId: string): Promise<CartDocument> {

    const cart = await this.cartRepository.findOne(
      { user: userId },
      null,
      null,
    );
    if (!cart) {
      throw new NotFoundException('Cart not found for this user');
    }

    return await cart.populate({
      path: 'products.product',
      select: 'name mainImage price discount quantity slug', 
    }) as CartDocument; 
  }

  async addToCart(userId: string, addToCartDto: AddToCartDto): Promise<CartDocument> {
    const { productId, quantity } = addToCartDto;

    const product = await this.productRepository.findById(productId.toString());
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (quantity > product.stock) {
      throw new BadRequestException(`Insufficient stock for product: ${product.name}. Available: ${product.stock}`);
    }

    let cart = await this.cartRepository.findOne({ user: userId });

    if (!cart) {

      cart = await this.cartRepository.create({
        user: userId,
        products: [{ product: new mongoose.Types.ObjectId(productId) as any, quantity, finalPrice: product.price }], 
        subTotal: quantity * product.price,
      });
    } else {
      const productIndex = cart.products.findIndex(
        (item) => (item.product as unknown as mongoose.Types.ObjectId).toString() === productId.toString(),
      );

      if (productIndex > -1) {

        throw new BadRequestException('Product already in cart. Use update quantity endpoint instead.');
      } else {

        cart.products.push({ product: new mongoose.Types.ObjectId(productId) as any, quantity, finalPrice: product.price }); 
      }

      await cart.save();
    }

    const updatedCart = await this.cartRepository.findOne(
      { _id: cart._id.toString() }, 
      null,
      null,
    );

    if (!updatedCart) {
      throw new NotFoundException('Updated cart not found after add to cart operation.');
    }

    return await updatedCart.populate({
      path: 'products.product',
      select: 'name mainImage price discount quantity slug',
    }) as CartDocument; 
  }

  async updateCartProductQuantity(
    userId: string,
    productId: string,
    updateCartQuantityDto: UpdateCartQuantityDto,
  ): Promise<CartDocument> {
    const { quantity } = updateCartQuantityDto;

    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (quantity > product.stock) {
      throw new BadRequestException(`Insufficient stock for product: ${product.name}. Available: ${product.stock}`);
    }

    const cart = await this.cartRepository.findOne({ user: userId });
    if (!cart) {
      throw new NotFoundException('Cart not found for this user');
    }

    const productIndex = cart.products.findIndex(
      (item) => (item.product as unknown as mongoose.Types.ObjectId).toString() === productId,
    );

    if (productIndex === -1) {
      throw new NotFoundException('Product not found in cart');
    }

    cart.products[productIndex].quantity = quantity;
    await cart.save(); 

    const updatedCart = await this.cartRepository.findOne(
      { _id: cart._id.toString() }, 
      null,
      null,
    );

    if (!updatedCart) {
      throw new NotFoundException('Updated cart not found after quantity update operation.');
    }

    return await updatedCart.populate({
      path: 'products.product',
      select: 'name mainImage price discount quantity slug',
    }) as CartDocument; 
  }

  async removeProductFromCart(userId: string, productId: string): Promise<CartDocument> {
    const cart = await this.cartRepository.findOne({ user: userId });
    if (!cart) {
      throw new NotFoundException('Cart not found for this user');
    }

    const initialProductCount = cart.products.length;
    cart.products = cart.products.filter(
      (item) => (item.product as unknown as mongoose.Types.ObjectId).toString() !== productId,
    );

    if (cart.products.length === initialProductCount) {
      throw new NotFoundException('Product not found in cart');
    }

    await cart.save(); 

    const updatedCart = await this.cartRepository.findOne(
      { _id: cart._id.toString() }, 
      null,
      null,
    );

    if (!updatedCart) {
      throw new NotFoundException('Updated cart not found after product removal operation.');
    }

    return await updatedCart.populate({
      path: 'products.product',
      select: 'name mainImage price discount quantity slug',
    }) as CartDocument; 
  }

  async clearCart(userId: string): Promise<CartDocument> {
    const cart = await this.cartRepository.findOne({ user: userId });
    if (!cart) {
      throw new NotFoundException('Cart not found for this user');
    }

    cart.products = [];
    await cart.save(); 

    const clearedCart = await this.cartRepository.findOne(
      { _id: cart._id.toString() }, 
      null,
      null,
    );

    if (!clearedCart) {
      throw new NotFoundException('Cleared cart not found after clear cart operation.');
    }

    return await clearedCart.populate({
      path: 'products.product',
      select: 'name mainImage price discount quantity slug',
    }) as CartDocument; 
  }
}

