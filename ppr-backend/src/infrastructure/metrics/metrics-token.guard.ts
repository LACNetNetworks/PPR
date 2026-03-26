import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

@Injectable()
export class MetricsTokenGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers['authorization'] ?? '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;

    const expected = this.configService.get<string>('METRICS_TOKEN');
    if (!expected || token !== expected) {
      throw new UnauthorizedException('Invalid or missing metrics token');
    }
    return true;
  }
}
