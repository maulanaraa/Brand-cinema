import { Router } from 'express';
import * as concessionController from '../controllers/concession.controller';
import { authenticate, authorizeAdmin, optionalAuthenticate, validate } from '../middlewares';
import {
  concessionQueryValidator,
  concessionIdValidator,
  createConcessionValidator,
  updateConcessionValidator,
} from '../validators';

const router = Router();

/**
 * @swagger
 * /api/concessions:
 *   get:
 *     tags: [Concessions]
 *     summary: List concessions
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
 *         name: category
 *         schema: { type: string, enum: [combo, popcorn, drinks, snacks] }
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [sortOrder, name, price, createdAt] }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc] }
 *       - in: query
 *         name: isActive
 *         schema: { type: string, enum: [true, false, all] }
 *     responses:
 *       200:
 *         description: Concession list
 */
router.get(
  '/',
  optionalAuthenticate,
  concessionQueryValidator,
  validate,
  concessionController.getConcessions
);

/**
 * @swagger
 * /api/concessions/{id}:
 *   get:
 *     tags: [Concessions]
 *     summary: Get concession by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Concession details
 *       404:
 *         description: Concession not found
 */
router.get(
  '/:id',
  optionalAuthenticate,
  concessionIdValidator,
  validate,
  concessionController.getConcessionById
);

/**
 * @swagger
 * /api/concessions:
 *   post:
 *     tags: [Concessions]
 *     summary: Create concession (Admin)
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, description, price, category, imageUrl]
 *             properties:
 *               name: { type: string, minLength: 2, maxLength: 120 }
 *               description: { type: string }
 *               price: { type: integer, minimum: 0 }
 *               category: { type: string, enum: [combo, popcorn, drinks, snacks] }
 *               imageUrl: { type: string, format: uri }
 *               badge: { type: string }
 *               isActive: { type: boolean }
 *               sortOrder: { type: integer, minimum: 0 }
 *     responses:
 *       201:
 *         description: Concession created
 */
router.post(
  '/',
  authenticate,
  authorizeAdmin,
  createConcessionValidator,
  validate,
  concessionController.createConcession
);

/**
 * @swagger
 * /api/concessions/{id}:
 *   put:
 *     tags: [Concessions]
 *     summary: Update concession (Admin)
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
 *               name: { type: string, minLength: 2, maxLength: 120 }
 *               description: { type: string }
 *               price: { type: integer, minimum: 0 }
 *               category: { type: string, enum: [combo, popcorn, drinks, snacks] }
 *               imageUrl: { type: string, format: uri }
 *               badge: { type: string }
 *               isActive: { type: boolean }
 *               sortOrder: { type: integer, minimum: 0 }
 *     responses:
 *       200:
 *         description: Concession updated
 */
router.put(
  '/:id',
  authenticate,
  authorizeAdmin,
  updateConcessionValidator,
  validate,
  concessionController.updateConcession
);

/**
 * @swagger
 * /api/concessions/{id}:
 *   delete:
 *     tags: [Concessions]
 *     summary: Soft delete concession (Admin)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Concession deleted
 */
router.delete(
  '/:id',
  authenticate,
  authorizeAdmin,
  concessionIdValidator,
  validate,
  concessionController.deleteConcession
);

export default router;
