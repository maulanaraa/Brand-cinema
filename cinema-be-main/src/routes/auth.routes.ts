import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import {
  authenticate,
  validate,
  loginRateLimiter,
  registerRateLimiter,
  resetPasswordRateLimiter,
  forgotPasswordRateLimiter,
  forgotPasswordIpRateLimiter,
} from '../middlewares';
import { registerValidator, loginValidator, forgotPasswordValidator, resetPasswordValidator, googleAuthValidator } from '../validators';

const router = Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       201:
 *         description: Registered successfully
 */
router.post('/register', registerRateLimiter, registerValidator, validate, authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post('/login', loginRateLimiter, loginValidator, validate, authController.login);

/**
 * @swagger
 * /api/auth/google:
 *   post:
 *     tags: [Auth]
 *     summary: Login or register with Google OAuth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idToken: { type: string, description: Google ID token from Sign In button }
 *               credential: { type: string, description: Alias for idToken (Google GIS response) }
 *     responses:
 *       200:
 *         description: Google login successful
 */
router.post('/google', loginRateLimiter, googleAuthValidator, validate, authController.googleAuth);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request password reset email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string }
 *     responses:
 *       200:
 *         description: Reset email sent if account exists
 */
router.post(
  '/forgot-password',
  forgotPasswordIpRateLimiter,
  forgotPasswordRateLimiter,
  forgotPasswordValidator,
  validate,
  authController.forgotPassword
);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password with token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Password reset successful
 */
router.post('/reset-password', resetPasswordRateLimiter, resetPasswordValidator, validate, authController.resetPassword);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout user
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current user
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Current user data
 */
router.get('/me', authenticate, authController.getMe);

export default router;
