import { Application } from 'express';
import request from 'supertest';
import { unsign } from 'cookie-signature';
import { createApp } from '../app';
import { User } from '../models/User';
import { UserRole } from '../types';
import { hashPassword } from '../utils/auth.util';
import { COOKIE_NAME, RATE_LIMIT } from '../constants';
import {
  clearTestDatabase,
  connectTestDatabase,
  disconnectTestDatabase,
} from './helpers/database';

const normalizeSetCookieHeader = (header: string | string[] | undefined): string[] => {
  if (!header) {
    return [];
  }
  return Array.isArray(header) ? header : [header];
};

const extractTokenFromSetCookie = (setCookieHeader: string | string[] | undefined): string => {
  const cookies = normalizeSetCookieHeader(setCookieHeader);
  const line = cookies.find((cookie) => cookie.startsWith(`${COOKIE_NAME}=`));
  if (!line) {
    throw new Error('Auth cookie not found');
  }

  const rawValue = decodeURIComponent(line.split(';')[0].split('=').slice(1).join('='));
  if (!rawValue.startsWith('s:')) {
    return rawValue;
  }

  const token = unsign(rawValue.slice(2), process.env.COOKIE_SECRET!);
  if (!token) {
    throw new Error('Unable to unsign auth cookie');
  }

  return token;
};

describe('Auth security scenarios', () => {
  let app: Application;

  const validUser = {
    name: 'Test User',
    email: 'user@example.com',
    password: 'password123',
  };

  beforeAll(async () => {
    await connectTestDatabase();
    app = createApp();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  describe('registration', () => {
    it('allows valid registration', async () => {
      const response = await request(app).post('/api/auth/register').send(validUser);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toMatchObject({
        name: validUser.name,
        email: validUser.email,
        role: UserRole.USER,
      });
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('rejects duplicate email without revealing account existence', async () => {
      await request(app).post('/api/auth/register').send(validUser);

      const response = await request(app).post('/api/auth/register').send(validUser);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Unable to complete registration');
      expect(response.body.message).not.toMatch(/already/i);
    });

    it('rejects invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...validUser, email: 'not-an-email' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors).toContain('Invalid email');
    });

    it('rejects missing email and password', async () => {
      const response = await request(app).post('/api/auth/register').send({ name: 'Only Name' });

      expect(response.status).toBe(400);
      expect(response.body.errors).toEqual(
        expect.arrayContaining(['Email is required', 'Password is required'])
      );
    });

    it('ignores password confirmation fields on the backend', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...validUser, confirmPassword: 'different-password' });

      expect(response.status).toBe(201);
      expect(response.body.data.user.email).toBe(validUser.email);
    });

    it('does not leak password hash in API response', async () => {
      const response = await request(app).post('/api/auth/register').send(validUser);

      expect(response.body.data.user).not.toHaveProperty('password');
      expect(JSON.stringify(response.body)).not.toMatch(/\$2[aby]\$/);
    });

    it('prevents admin role injection during registration', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...validUser, email: 'hacker@example.com', role: UserRole.ADMIN });

      expect(response.status).toBe(400);
      expect(response.body.errors).toContain('Role cannot be set during registration');
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(validUser);
    });

    it('allows normal valid login', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: validUser.email,
        password: validUser.password,
      });

      expect(response.status).toBe(200);
      expect(response.body.data.user.email).toBe(validUser.email);
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('rejects unknown password', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: validUser.email,
        password: 'wrong-password',
      });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid email or password');
    });

    it('rejects unknown account', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'missing@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid email or password');
    });

    it('rejects missing email and password', async () => {
      const response = await request(app).post('/api/auth/login').send({});

      expect(response.status).toBe(400);
      expect(response.body.errors).toEqual(
        expect.arrayContaining(['Email is required', 'Password is required'])
      );
    });

    it('blocks NoSQL operator injection in login payload', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: { $gt: '' }, password: 'password123' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Validation failed');
    });

    it('sets secure auth cookie attributes', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: validUser.email,
        password: validUser.password,
      });

      const cookieHeader = normalizeSetCookieHeader(response.headers['set-cookie']).join('; ');

      expect(cookieHeader).toContain('HttpOnly');
      expect(cookieHeader).toContain('SameSite=Lax');
      expect(decodeURIComponent(cookieHeader)).toMatch(new RegExp(`${COOKIE_NAME}=s:`));
    });
  });

  describe('authorization', () => {
    it('denies normal user access to admin-only endpoint', async () => {
      await request(app).post('/api/auth/register').send(validUser);
      const agent = request.agent(app);

      await agent.post('/api/auth/login').send({
        email: validUser.email,
        password: validUser.password,
      });

      const response = await agent.get('/api/admin/dashboard');

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Forbidden');
    });

    it('allows admin access to admin-only endpoint', async () => {
      const hashedPassword = await hashPassword('adminpassword');
      await User.create({
        name: 'Admin User',
        email: 'admin@example.com',
        password: hashedPassword,
        role: UserRole.ADMIN,
      });

      const agent = request.agent(app);
      await agent.post('/api/auth/login').send({
        email: 'admin@example.com',
        password: 'adminpassword',
      });

      const response = await agent.get('/api/admin/dashboard');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('logout and session invalidation', () => {
    it('blocks access after logout using cookie session', async () => {
      const agent = request.agent(app);

      await agent.post('/api/auth/register').send(validUser);
      await agent.post('/api/auth/logout');

      const response = await agent.get('/api/auth/me');

      expect(response.status).toBe(401);
    });

    it('blocks bearer token access after logout', async () => {
      const loginResponse = await request(app).post('/api/auth/register').send(validUser);
      const token = extractTokenFromSetCookie(loginResponse.headers['set-cookie']);

      await request(app).post('/api/auth/logout').set('Authorization', `Bearer ${token}`);

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(401);
    });

    it('requires authentication to logout', async () => {
      const response = await request(app).post('/api/auth/logout');

      expect(response.status).toBe(401);
    });
  });

  describe('optional auth endpoints', () => {
    it('allows unauthenticated read access where optional auth is used', async () => {
      const response = await request(app).get('/api/concessions');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});

describe('Auth rate limiting', () => {
  let app: Application;

  beforeAll(async () => {
    process.env.TEST_RATE_LIMIT = 'true';
    await connectTestDatabase();
    app = createApp();
  });

  afterAll(async () => {
    delete process.env.TEST_RATE_LIMIT;
    await disconnectTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
    await request(app).post('/api/auth/register').send({
      name: 'Rate Limit User',
      email: 'ratelimit@example.com',
      password: 'password123',
    });
  });

  it('rate limits repeated failed login attempts', async () => {
    const attempts = RATE_LIMIT.LOGIN.max + 1;
    let lastStatus = 0;

    for (let i = 0; i < attempts; i += 1) {
      const response = await request(app).post('/api/auth/login').send({
        email: 'ratelimit@example.com',
        password: 'wrong-password',
      });
      lastStatus = response.status;
    }

    expect(lastStatus).toBe(429);
  });
});
