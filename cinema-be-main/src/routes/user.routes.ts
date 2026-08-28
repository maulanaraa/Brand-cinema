import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { authenticate, authorizeAdmin, validate } from '../middlewares';
import {
  createUserValidator,
  updateUserValidator,
  userIdValidator,
  userQueryValidator,
} from '../validators';

const router = Router();

router.use(authenticate, authorizeAdmin);

/**
 * @swagger
 * /api/users:
 *   get:
 *     tags: [Users]
 *     summary: List users (Admin)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [name, email, role, createdAt] }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc] }
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [ADMIN, USER] }
 *     responses:
 *       200:
 *         description: User list
 */
router.get('/', userQueryValidator, validate, userController.getUsers);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by ID (Admin)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User details
 *       404:
 *         description: User not found
 */
router.get('/:id', userIdValidator, validate, userController.getUserById);

/**
 * @swagger
 * /api/users:
 *   post:
 *     tags: [Users]
 *     summary: Create user (Admin)
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string, maxLength: 100 }
 *               email: { type: string, format: email }
 *               password: { type: string }
 *               role: { type: string, enum: [ADMIN, USER] }
 *     responses:
 *       201:
 *         description: User created
 */
router.post('/', createUserValidator, validate, userController.createUser);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     tags: [Users]
 *     summary: Update user (Admin)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, maxLength: 100 }
 *               email: { type: string, format: email }
 *               password: { type: string }
 *               role: { type: string, enum: [ADMIN, USER] }
 *     responses:
 *       200:
 *         description: User updated
 */
router.put('/:id', updateUserValidator, validate, userController.updateUser);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Soft delete user (Admin)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User deleted
 */
router.delete('/:id', userIdValidator, validate, userController.deleteUser);

export default router;
