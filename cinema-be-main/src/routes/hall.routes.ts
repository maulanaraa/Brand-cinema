import { Router } from 'express';
import * as hallController from '../controllers/hall.controller';
import { authenticate, authorizeAdmin, optionalAuthenticate, validate } from '../middlewares';
import {
  hallQueryValidator,
  hallIdValidator,
  createHallValidator,
  updateHallValidator,
} from '../validators';

const router = Router();

/**
 * @swagger
 * /api/halls:
 *   get:
 *     tags: [Halls]
 *     summary: List halls
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
 *         schema: { type: string, enum: [name, totalSeats, createdAt] }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc] }
 *       - in: query
 *         name: isActive
 *         schema: { type: string, enum: [true, false, all] }
 *     responses:
 *       200:
 *         description: Hall list
 */
router.get('/', optionalAuthenticate, hallQueryValidator, validate, hallController.getHalls);

/**
 * @swagger
 * /api/halls/{id}:
 *   get:
 *     tags: [Halls]
 *     summary: Get hall by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Hall details
 *       404:
 *         description: Hall not found
 */
router.get('/:id', optionalAuthenticate, hallIdValidator, validate, hallController.getHallById);

/**
 * @swagger
 * /api/halls:
 *   post:
 *     tags: [Halls]
 *     summary: Create hall (Admin)
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, totalSeats, layoutRows, layoutColumns]
 *             properties:
 *               name: { type: string }
 *               totalSeats: { type: integer, minimum: 1, description: Must equal layoutRows × layoutColumns }
 *               layoutRows: { type: integer, minimum: 1 }
 *               layoutColumns: { type: integer, minimum: 1 }
 *               isActive: { type: boolean }
 *     responses:
 *       201:
 *         description: Hall created
 */
router.post(
  '/',
  authenticate,
  authorizeAdmin,
  createHallValidator,
  validate,
  hallController.createHall
);

/**
 * @swagger
 * /api/halls/{id}:
 *   put:
 *     tags: [Halls]
 *     summary: Update hall (Admin)
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
 *               name: { type: string }
 *               totalSeats: { type: integer, minimum: 1 }
 *               layoutRows: { type: integer, minimum: 1 }
 *               layoutColumns: { type: integer, minimum: 1 }
 *               isActive: { type: boolean }
 *     responses:
 *       200:
 *         description: Hall updated
 */
router.put(
  '/:id',
  authenticate,
  authorizeAdmin,
  updateHallValidator,
  validate,
  hallController.updateHall
);

/**
 * @swagger
 * /api/halls/{id}:
 *   delete:
 *     tags: [Halls]
 *     summary: Soft delete hall (Admin)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Hall deleted
 */
router.delete(
  '/:id',
  authenticate,
  authorizeAdmin,
  hallIdValidator,
  validate,
  hallController.deleteHall
);

export default router;
