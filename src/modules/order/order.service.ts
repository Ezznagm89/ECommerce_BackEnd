import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { OrderRepository, CartRepository, ProductRepository, CouponRepository } from 'src/database/repositories';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderDocument, UserDocument, ProductDocument, CartDocument, CouponDocument } from 'src/database/models';
import { QueryOrderDto } from './dto/query-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderStatus, PaymentMethod } from 'src/common/enums';
import mongoose from 'mongoose';
import { StripeService } from '../stripe/stripe.service';
import { CouponService } from '../coupon/coupon.service'; 

@Injectable()
export class OrderService {
  constructor(
    private orderRepository: OrderRepository,
    private cartRepository: CartRepository,
    private productRepository: ProductRepository,
    private couponRepository: CouponRepository, 
    private couponService: CouponService, 
    private stripeService: StripeService,
  ) {}

  async createOrder(createOrderDto: CreateOrderDto, userId: string): Promise<OrderDocument> {
    const { address, phone, paymentMethod, couponCode } = createOrderDto;

    let cart = await this.cartRepository.findOne({ user: userId });
    if (!cart || cart.products.length === 0) {
      throw new BadRequestException('Cannot create an order with an empty cart');
    }

    const cartDoc = await this.cartRepository.findOne(
      { _id: cart._id.toString() }, 
      null,
      null,
    );
    cart = await cartDoc.populate({
      path: 'products.product',
      select: 'name mainImage price discount quantity stock slug',
    }) as CartDocument; 

    let coupon: CouponDocument | null = null;
    let totalPrice = cart.subTotal;

    if (couponCode) {

      coupon = await this.couponService.applyCoupon(couponCode, userId); 

      totalPrice = cart.subTotal * (1 - coupon.amount / 100);
    }

    for (const item of cart.products) {
      const product = item.product as ProductDocument;
      if (item.quantity > product.stock) {
        throw new BadRequestException(`Insufficient stock for product: ${product.name}. Available: ${product.stock}`);
      }
    }

    let orderStatusDetails = { status: OrderStatus.PENDING };
    let paymentDetails = null;

    if (paymentMethod === PaymentMethod.CASH) {
      orderStatusDetails.status = OrderStatus.PLACED; 
    } else if (paymentMethod === PaymentMethod.CARD) {

      orderStatusDetails.status = OrderStatus.PENDING;
    }

    const order = await this.orderRepository.create({
      user: userId,
      cart: cart._id,
      coupon: coupon ? coupon._id : null,
      totalPrice: totalPrice,
      address,
      phone,
      paymentMethod,
      paymentDetails, 
      statusDetails: orderStatusDetails,
    });

    if (!order) {
      throw new BadRequestException('Failed to create order');
    }

    if (coupon) {
      await this.couponService.markCouponAsUsed(coupon._id, userId); 
    }

    if (paymentMethod === PaymentMethod.CASH) {
      await this.reduceProductStockAndClearCart(cart, userId);
    }

    return order;
  }

  async processCardPayment(orderId: string, userId: string): Promise<{ sessionUrl: string }> {
    let order = await this.orderRepository.findById(orderId);
    if (!order || order.user.toString() !== userId) {
      throw new NotFoundException('Order not found or unauthorized');
    }
    if (order.paymentMethod !== PaymentMethod.CARD) {
      throw new BadRequestException('Order is not set for card payment');
    }
    if (order.statusDetails.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Order is not in pending status for payment');
    }

    const orderDoc = await this.orderRepository.findById(orderId);
    order = await orderDoc.populate({
      path: 'cart',
      populate: {
        path: 'products.product',
        select: 'name mainImage price',
      },
    }) as OrderDocument; 

    if (!order || !order.cart) {
      throw new NotFoundException('Order cart details not found');
    }

    const cart = order.cart as CartDocument;
    const userEmail = (order.user as UserDocument).email;

    const lineItems = cart.products.map((item) => {
      const product = item.product as ProductDocument;
      return {
        price_data: {
          currency: 'usd', 
          product_data: {
            name: product.name,
            images: product.mainImage ? [product.mainImage] : [],
          },
          unit_amount: Math.round(item.finalPrice * 100), 
        },
        quantity: item.quantity,
      };
    });

    const session = await this.stripeService.createCheckoutSession(
      lineItems,
      userEmail,
      order._id.toString(),
    );

    return { sessionUrl: session.url };
  }

  async handleStripeWebhook(rawBody: Buffer, signature: string): Promise<{ message: string }> {
    const event = await this.stripeService.handleWebhook(rawBody, signature);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const orderId = (session.metadata as any).orderId;
      const paymentIntentId = session.payment_intent;

      const order = await this.orderRepository.findById(orderId);
      if (!order) {
        throw new NotFoundException('Order not found for completed session');
      }

      if (order.statusDetails.status === OrderStatus.PENDING) {
        order.statusDetails.status = OrderStatus.PLACED;
        order.paymentDetails = {
          paymentIntentId: paymentIntentId as string,
          paidAt: new Date(),
          paidBy: order.user,
        };
        await order.save(); 

        await this.reduceProductStockAndClearCart(order.cart as CartDocument, order.user.toString());
      }
    }

    return { message: 'Webhook received successfully' };
  }

  async findAllOrders(queryDto: QueryOrderDto, userId: string, isAdmin: boolean): Promise<{ data: OrderDocument[]; currentPage: number; totalPages: number; totalItems: number }> {
    const { search, page, limit, status, paymentMethod, fromDate, toDate } = queryDto;
    const filter: any = {};

    if (!isAdmin) {
      filter.user = userId;
    }

    if (search) {
      filter.$or = [
        { address: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }
    if (status) filter['statusDetails.status'] = status;
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (fromDate) filter.createdAt = { $gte: new Date(fromDate) };
    if (toDate) filter.createdAt = { ...filter.createdAt, $lte: new Date(toDate) };

    return this.orderRepository.paginate(
      filter,
      page,
      limit,
      null,
      null,
      [{ path: 'user', select: 'firstName lastName email' }, { path: 'cart', populate: { path: 'products.product', select: 'name mainImage' } }, { path: 'coupon', select: 'code amount' }],
      { createdAt: -1 } 
    );
  }

  async findOrderById(id: string, userId: string, isAdmin: boolean): Promise<OrderDocument> {
    const filter: any = { _id: id };
    if (!isAdmin) {
      filter.user = userId;
    }
    const orderDoc = await this.orderRepository.findOne(filter);
    const order = await orderDoc.populate([
      { path: 'user', select: 'firstName lastName email' },
      { path: 'cart', populate: { path: 'products.product', select: 'name mainImage price discount quantity slug' } },
      { path: 'coupon', select: 'code amount' },
    ]) as OrderDocument; 
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  async cancelOrder(orderId: string, userId: string, isAdmin: boolean, cancelReason?: string): Promise<OrderDocument> {
    let order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (!isAdmin && order.user.toString() !== userId) {
      throw new UnauthorizedException('You are not authorized to cancel this order');
    }

    if ([OrderStatus.CANCELLED, OrderStatus.DELIVERED, OrderStatus.REFUNDED].includes(order.statusDetails.status)) {
      throw new BadRequestException(`Cannot cancel an order with status: ${order.statusDetails.status}`);
    }

    if (order.paymentMethod === PaymentMethod.CARD && order.paymentDetails?.paymentIntentId) {

      order.statusDetails.refundedAt = new Date(); 
    }

    order = await this.orderRepository.findByIdAndUpdate(orderId, {
      'statusDetails.status': OrderStatus.CANCELLED,
      'statusDetails.cancelledAt': new Date(),
      'statusDetails.cancelledBy': userId,
      'statusDetails.cancelReason': cancelReason || 'User requested cancellation',
    });

    if (!order) {
      throw new BadRequestException('Failed to cancel order');
    }

    await this.restoreProductStockAfterCancellation(order.cart as CartDocument);

    return order;
  }

  async updateOrderStatus(orderId: string, newStatus: OrderStatus, userId: string): Promise<OrderDocument> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.statusDetails.status === newStatus) {
      throw new BadRequestException(`Order already in ${newStatus} status`);
    }

    const updatePayload: any = {
      'statusDetails.status': newStatus,
      updatedBy: userId,
    };

    if (newStatus === OrderStatus.DELIVERED) {

      await this.markProductsAsSold(order.cart as CartDocument);
    }

    return this.orderRepository.findByIdAndUpdate(orderId, updatePayload);
  }

  private async reduceProductStockAndClearCart(cart: CartDocument, userId: string): Promise<void> {

    const cartDoc = await this.cartRepository.findById(cart._id.toString());
    const populatedCart = await cartDoc.populate({ path: 'products.product', select: 'name quantity sold' }) as CartDocument; 

    if (!populatedCart) {
      console.error(`Cart not found for reducing stock: ${cart._id}`);
      return;
    }

    for (const item of populatedCart.products) {
      await this.productRepository.findByIdAndUpdate(
        (item.product as unknown as mongoose.Types.ObjectId).toString(),
        { $inc: { quantity: -item.quantity, sold: item.quantity } },
      );
    }

    await this.cartRepository.findByIdAndUpdate(cart._id.toString(), { products: [], subTotal: 0 }); 
  }

  private async restoreProductStockAfterCancellation(cart: CartDocument): Promise<void> {

    const cartDoc2 = await this.cartRepository.findById(cart._id.toString());
    const populatedCart = await cartDoc2.populate({
      path: 'products.product',
      select: 'name quantity sold',
    }) as CartDocument; 

    if (!populatedCart) {
      console.error(`Cart not found for restoring stock: ${cart._id}`);
      return;
    }

    for (const item of populatedCart.products) {
      await this.productRepository.findByIdAndUpdate(
        (item.product as unknown as mongoose.Types.ObjectId).toString(),
        { $inc: { quantity: item.quantity, sold: -item.quantity } },
      );
    }
  }

  private async markProductsAsSold(cart: CartDocument): Promise<void> {

  }

  async softDeleteOrder(id: string, userId: string): Promise<{ message: string }> {
    const order = await this.orderRepository.softDelete(id, userId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return { message: 'Order soft deleted successfully' };
  }

  async restoreOrder(id: string): Promise<{ message: string }> {
    const order = await this.orderRepository.restore(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return { message: 'Order restored successfully' };
  }

  async deleteOrder(id: string): Promise<{ message: string }> {
    const order = await this.orderRepository.deleteById(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return { message: 'Order hard deleted successfully' };
  }
}

