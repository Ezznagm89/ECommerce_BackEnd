import { Controller, Get, Param, Res, UseGuards, UseInterceptors, ForbiddenException } from '@nestjs/common';
import { AppService } from './app.service';
import { Response } from 'express';
import { join } from 'path';
import { AuthGuard } from 'src/common/guards';
import { CacheInterceptor } from '@nestjs/cache-manager'; 

@Controller()

@UseGuards(AuthGuard)
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('uploads/:filename')
  @UseInterceptors(CacheInterceptor) 
  getUploadedFile(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = join(process.cwd(), 'uploads', filename);
    res.sendFile(filePath);
  }
}

