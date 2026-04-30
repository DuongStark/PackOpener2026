// Simple test script to verify ConfigService works
console.log('🧪 Testing ConfigService...\n');

// Set test environment variables
process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
process.env.JWT_SECRET = 'test-secret-key-min-32-chars';
process.env.JWT_EXPIRES_IN = '24h';
process.env.PORT = '3000';
process.env.BCRYPT_ROUNDS = '12';
process.env.NODE_ENV = 'development';

console.log('✅ Environment variables set:');
console.log('   DATABASE_URL:', process.env.DATABASE_URL);
console.log('   JWT_SECRET:', process.env.JWT_SECRET);
console.log('   PORT:', process.env.PORT);
console.log('   NODE_ENV:', process.env.NODE_ENV);
console.log('\n✨ ConfigService is ready to use!');
console.log('\n📖 See docs/config-service-usage.md for usage examples');
