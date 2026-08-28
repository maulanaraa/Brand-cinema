process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-auth-suite';
process.env.COOKIE_SECRET = process.env.COOKIE_SECRET || 'test-cookie-secret-key-for-auth';
process.env.JWT_EXPIRE = '1h';
