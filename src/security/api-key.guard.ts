/**
 * API Key Guard
 */

import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly validApiKeys: string[];

  constructor(private configService: ConfigService) {
    // In production, API keys should be stored in database
    // For now, use environment variable (comma-separated)
    const apiKeys = this.configService.get<string>('API_KEYS') || '';
    this.validApiKeys = apiKeys.split(',').filter((key) => key.trim().length > 0);
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'] || request.headers['X-API-Key'];

    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    if (this.validApiKeys.length === 0) {
      // If no API keys configured, allow all (for development)
      return true;
    }

    if (!this.validApiKeys.includes(apiKey)) {
      throw new UnauthorizedException('Invalid API key');
    }

    return true;
  }
}

