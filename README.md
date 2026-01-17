# E-Commerce Backend

A NestJS + MongoDB backend that powers an e-commerce platform with authentication, catalog management, carts, orders, Stripe payments, and real-time notifications over WebSockets.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Architecture Overview](#architecture-overview)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Run the API](#run-the-api)
- [Modules Index](#modules-index)
- [API Index](#api-index)
  - [Auth](#auth)
  - [Users](#users)
  - [Brands](#brands)
  - [Categories](#categories)
  - [Products](#products)
  - [Cart](#cart)
  - [Coupons](#coupons)
  - [Orders](#orders)
  - [Stripe](#stripe)
- [WebSockets](#websockets)
- [Error Handling](#error-handling)
- [Caching](#caching)
- [Uploads](#uploads)
- [Scripts](#scripts)

## Features

- **Authentication & authorization** with JWT access tokens, role-based access control, and email verification.
- **User management** with profile updates and profile image uploads.
- **Catalog management** for brands, categories, and products (including image uploads).
- **Shopping cart** workflows: add items, update quantities, remove items, clear cart.
- **Orders** with cash-on-delivery or Stripe checkout flows, plus order status updates and cancellations.
- **Coupons** for discount management.
- **Stripe webhooks** for payment confirmation.
- **WebSockets** for authenticated real-time messages and notifications.
- **Redis-backed caching** via Nest cache manager.

## Tech Stack

- **Runtime:** Node.js, TypeScript
- **Framework:** NestJS
- **Database:** MongoDB (Mongoose)
- **Cache:** Redis
- **Auth:** JWT + Passport
- **Payments:** Stripe
- **Real-time:** Socket.IO

## Project Structure

```
src/
  app/                  # App module + bootstrapping
  common/               # Guards, decorators, pipes, middleware, filters
  database/             # Mongoose models + repositories
  modules/              # Feature modules (auth, user, product, etc.)
  main.ts               # App entrypoint
```

## Architecture Overview

- **NestJS modules** encapsulate domain areas (auth, user, catalog, orders, etc.).
- **Mongoose** models live under `src/database/models` with repository wrappers under `src/database/repositories`.
- **Guards** enforce authentication (JWT) and role-based access control across controllers.
- **Validation** is handled by DTOs with `class-validator` and global `ValidationPipe`.
- **Stripe** integration handles checkout sessions and webhooks.
- **Socket.IO** gateway provides authenticated realtime communications.
- **Cache manager** (Redis store) is registered globally for response caching.

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB
- Redis
- Stripe account (for payment flows)

### Installation

```bash
npm install
```

### Environment Variables

Create `config/.env` with the values below (aligned with ConfigModule configuration):

```
PORT=3000
MONGO_URI=mongodb://localhost:27017/ecommerce
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
JWT_SECRET=change-me
JWT_EXPIRATION_TIME=1d
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=http://localhost:3000
```

### Run the API

```bash
npm run start:dev
```

The server will start on the configured `PORT` (defaults to `3000`).

## Modules Index

- **AppModule** (`src/app`) — root module wiring config, MongoDB, Redis cache, and feature modules.
- **Auth Module** (`src/modules/auth`) — registration, login, email verification, JWT issuance.
- **User Module** (`src/modules/user`) — user CRUD, profile updates, image uploads.
- **Brand Module** (`src/modules/brand`) — brand CRUD with image uploads.
- **Category Module** (`src/modules/category`) — category CRUD with image uploads.
- **Product Module** (`src/modules/product`) — product CRUD with images, soft delete/restore.
- **Cart Module** (`src/modules/cart`) — cart retrieval, add/remove items, quantity updates.
- **Coupon Module** (`src/modules/coupon`) — admin-only coupon management.
- **Order Module** (`src/modules/order`) — order creation, status updates, cancellations, webhook handling.
- **Stripe Module** (`src/modules/stripe`) — payment session orchestration.
- **WebSockets Module** (`src/modules/websockets`) — Socket.IO gateway and token validation.

## API Index

> All routes are prefixed by their controller path. Most endpoints require JWT auth unless marked public.

### Auth

- `POST /auth/register` — create a new user account (public).
- `POST /auth/login` — authenticate and receive a JWT (public).
- `POST /auth/verify-email` — verify email ownership (public).

### Users

- `POST /users` — create user (admin).
- `GET /users` — list users with query filters (admin).
- `GET /users/:id` — fetch user by id (admin or self).
- `PATCH /users/:id` — update user (admin or self).
- `PATCH /users/upload-image/:id` — upload profile image (admin or self).
- `DELETE /users/:id` — delete user (admin).

### Brands

- `POST /brands` — create brand (admin, image required).
- `GET /brands` — list brands with filters.
- `GET /brands/:id` — fetch brand by id.
- `PATCH /brands/:id` — update brand (admin).
- `PATCH /brands/upload-image/:id` — update brand image (admin).
- `PATCH /brands/soft-delete/:id` — soft delete (admin).
- `PATCH /brands/restore/:id` — restore (admin).
- `DELETE /brands/:id` — hard delete (admin).

### Categories

- `POST /categories` — create category (admin, image required).
- `GET /categories` — list categories with filters.
- `GET /categories/:id` — fetch category by id.
- `PATCH /categories/:id` — update category (admin).
- `PATCH /categories/upload-image/:id` — update category image (admin).
- `PATCH /categories/soft-delete/:id` — soft delete (admin).
- `PATCH /categories/restore/:id` — restore (admin).
- `DELETE /categories/:id` — hard delete (admin).

### Products

- `POST /products` — create product (admin, main image required).
- `GET /products` — list products with filters, pagination.
- `GET /products/:id` — fetch product by id.
- `PATCH /products/:id` — update product (admin).
- `PATCH /products/upload-images/:id` — update product images (admin).
- `PATCH /products/soft-delete/:id` — soft delete (admin).
- `PATCH /products/restore/:id` — restore (admin).
- `DELETE /products/:id` — hard delete (admin).

### Cart

- `GET /cart/my-cart` — fetch current user cart.
- `POST /cart/add` — add product to cart.
- `PATCH /cart/update-quantity/:productId` — change product quantity.
- `DELETE /cart/remove/:productId` — remove item from cart.
- `DELETE /cart/clear` — clear cart.

### Coupons

- `POST /coupons` — create coupon (admin).
- `GET /coupons` — list coupons (admin).
- `GET /coupons/:id` — fetch coupon (admin).
- `PATCH /coupons/:id` — update coupon (admin).
- `PATCH /coupons/soft-delete/:id` — soft delete (admin).
- `PATCH /coupons/restore/:id` — restore (admin).
- `DELETE /coupons/:id` — hard delete (admin).

### Orders

- `POST /orders` — create order; returns Stripe checkout URL if card payment is used.
- `POST /orders/webhook` — Stripe webhook endpoint (public).
- `GET /orders` — list orders (admin or user).
- `GET /orders/:id` — fetch order (admin or owner).
- `PATCH /orders/cancel/:id` — cancel order (admin or owner).
- `PATCH /orders/status/:id` — update status (admin).
- `PATCH /orders/soft-delete/:id` — soft delete (admin).
- `PATCH /orders/restore/:id` — restore (admin).
- `DELETE /orders/:id` — hard delete (admin).

### Stripe

- Stripe checkout sessions are created as part of the order flow when payment method is card.
- `POST /orders/webhook` is used to confirm payment events.

## WebSockets

- **Namespace:** `/socket`
- **Auth:** provide a valid JWT in the connection auth payload or in the `Authorization: Bearer <token>` header.
- **Events:**
  - `sendMessage` — broadcast a message to all clients.
  - `joinRoom` / `leaveRoom` — join or leave a room.
  - `roomMessage` — send a message to a room.
  - `connectionSuccess` — emitted on successful auth.
  - `authError` — emitted on auth failure.

## Error Handling

- Global exception filter normalizes errors into consistent JSON responses.
- Validation errors are returned with 400 status and field-level messages.

## Caching

- Redis cache is registered globally with a default TTL of 300 seconds.
- Cache interceptor applies to endpoints to improve read performance.

## Uploads

- Uploaded images are stored on the local filesystem under `./uploads`.
- Image uploads validate file extensions and enforce file size limits (5MB).

## Scripts

- `npm run start:dev` – run in watch mode
- `npm run build` – build the app
- `npm run start:prod` – run compiled output
- `npm run test` – run unit tests
