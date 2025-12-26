import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager'; 

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const { url } = request;
    const cachedData = await this.cacheManager.get(url);

    if (cachedData) {
      console.log(`Getting data from cache for url: ${url}`);
      return of(cachedData);
    }

    return next.handle().pipe(
      tap(async (data) => {
        console.log(`Caching data for url: ${url}`);

        await this.cacheManager.set(url, data, 5000); 
      }),
    );
  }
}

