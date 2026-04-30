import { Injectable } from '@nestjs/common';

@Injectable()
export class ConfigService {
  /**
   * Get environment variable as string
   */
  get(key: string, fallback?: string): string {
    const value = process.env[key];
    if (value === undefined) {
      if (fallback !== undefined) return fallback;
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
  }

  /**
   * Get environment variable as number
   */
  getNumber(key: string, fallback?: number): number {
    const raw = process.env[key];
    if (raw === undefined) {
      if (fallback !== undefined) return fallback;
      throw new Error(`Missing required environment variable: ${key}`);
    }

    const parsed = Number(raw);
    if (Number.isNaN(parsed)) {
      throw new Error(`Environment variable ${key} is not a valid number`);
    }

    return parsed;
  }

  /**
   * Get environment variable as boolean
   */
  getBoolean(key: string, fallback?: boolean): boolean {
    const raw = process.env[key];
    if (raw === undefined) {
      if (fallback !== undefined) return fallback;
      throw new Error(`Missing required environment variable: ${key}`);
    }

    return ['1', 'true', 'yes', 'on'].includes(raw.toLowerCase());
  }

  // ============================================
  // Helper methods cho Pack Opener Game
  // ============================================

  /**
   * Get database connection URL
   */
  getDatabaseUrl(): string {
    return this.get('DATABASE_URL');
  }

  /**
   * Get JWT secret key
   */
  getJwtSecret(): string {
    return this.get('JWT_SECRET');
  }

  /**
   * Get JWT expiration time (default: 24h)
   */
  getJwtExpiresIn(): string {
    return this.get('JWT_EXPIRES_IN', '24h');
  }

  /**
   * Get server port (default: 3000)
   */
  getPort(): number {
    return this.getNumber('PORT', 3000);
  }

  /**
   * Get bcrypt rounds (default: 12)
   */
  getBcryptRounds(): number {
    return this.getNumber('BCRYPT_ROUNDS', 12);
  }

  /**
   * Check if running in production
   */
  isProduction(): boolean {
    return this.get('NODE_ENV', 'development') === 'production';
  }

  /**
   * Check if running in development
   */
  isDevelopment(): boolean {
    return this.get('NODE_ENV', 'development') === 'development';
  }
}
