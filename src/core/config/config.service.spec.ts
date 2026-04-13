import { ConfigService } from './config.service';

describe('ConfigService', () => {
  let configService: ConfigService;

  beforeEach(() => {
    configService = new ConfigService();
  });

  describe('get', () => {
    it('should return environment variable value', () => {
      process.env.TEST_VAR = 'test-value';
      expect(configService.get('TEST_VAR')).toBe('test-value');
    });

    it('should return fallback value if variable not set', () => {
      delete process.env.TEST_VAR;
      expect(configService.get('TEST_VAR', 'fallback')).toBe('fallback');
    });

    it('should throw error if variable not set and no fallback', () => {
      delete process.env.TEST_VAR;
      expect(() => configService.get('TEST_VAR')).toThrow(
        'Missing required environment variable: TEST_VAR',
      );
    });
  });

  describe('getNumber', () => {
    it('should return number value', () => {
      process.env.TEST_NUMBER = '42';
      expect(configService.getNumber('TEST_NUMBER')).toBe(42);
    });

    it('should return fallback if variable not set', () => {
      delete process.env.TEST_NUMBER;
      expect(configService.getNumber('TEST_NUMBER', 100)).toBe(100);
    });

    it('should throw error if value is not a number', () => {
      process.env.TEST_NUMBER = 'not-a-number';
      expect(() => configService.getNumber('TEST_NUMBER')).toThrow(
        'Environment variable TEST_NUMBER is not a valid number',
      );
    });
  });

  describe('getBoolean', () => {
    it('should return true for truthy values', () => {
      const truthyValues = ['1', 'true', 'TRUE', 'yes', 'YES', 'on', 'ON'];
      truthyValues.forEach((value) => {
        process.env.TEST_BOOL = value;
        expect(configService.getBoolean('TEST_BOOL')).toBe(true);
      });
    });

    it('should return false for falsy values', () => {
      const falsyValues = ['0', 'false', 'no', 'off', 'anything-else'];
      falsyValues.forEach((value) => {
        process.env.TEST_BOOL = value;
        expect(configService.getBoolean('TEST_BOOL')).toBe(false);
      });
    });
  });

  describe('helper methods', () => {
    beforeEach(() => {
      process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
      process.env.JWT_SECRET = 'test-secret';
      process.env.JWT_EXPIRES_IN = '1h';
      process.env.PORT = '4000';
      process.env.BCRYPT_ROUNDS = '10';
      process.env.NODE_ENV = 'development';
    });

    it('should get database URL', () => {
      expect(configService.getDatabaseUrl()).toBe(
        'postgresql://localhost:5432/test',
      );
    });

    it('should get JWT secret', () => {
      expect(configService.getJwtSecret()).toBe('test-secret');
    });

    it('should get JWT expires in', () => {
      expect(configService.getJwtExpiresIn()).toBe('1h');
    });

    it('should get port', () => {
      expect(configService.getPort()).toBe(4000);
    });

    it('should get bcrypt rounds', () => {
      expect(configService.getBcryptRounds()).toBe(10);
    });

    it('should check if development', () => {
      expect(configService.isDevelopment()).toBe(true);
      expect(configService.isProduction()).toBe(false);
    });

    it('should check if production', () => {
      process.env.NODE_ENV = 'production';
      expect(configService.isProduction()).toBe(true);
      expect(configService.isDevelopment()).toBe(false);
    });
  });
});
