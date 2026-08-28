import { Router } from 'express';
import * as cinemaController from '../controllers/cinema.controller';
import { authenticate, authorizeAdmin, optionalAuthenticate, validate } from '../middlewares';
import {
  cinemaQueryValidator,
  cinemaIdValidator,
  createCinemaValidator,
  updateCinemaValidator,
} from '../validators';

const router = Router();

/**
 * @swagger
 * /api/cinemas:
 *   get:
 *     tags: [Cinemas]
 *     summary: List cinemas
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
 *         name: cityId
 *         schema: { type: string }
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [name, sortOrder, createdAt] }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc] }
 *       - in: query
 *         name: isActive
 *         schema: { type: string, enum: [true, false, all] }
 *     responses:
 *       200:
 *         description: Cinema list
 */
router.get('/', optionalAuthenticate, cinemaQueryValidator, validate, cinemaController.getCinemas);

/**
 * @swagger
 * /api/cinemas/{id}:
 *   get:
 *     tags: [Cinemas]
 *     summary: Get cinema by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Cinema details
 *       404:
 *         description: Cinema not found
 */
router.get(
  '/:id',
  optionalAuthenticate,
  cinemaIdValidator,
  validate,
  cinemaController.getCinemaById
);

/**
 * @swagger
 * /api/cinemas:
 *   post:
 *     tags: [Cinemas]
 *     summary: Create cinema (Admin)
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, cityId]
 *             properties:
 *               name: { type: string }
 *               cityId: { type: string }
 *               address: { type: string }
 *               isActive: { type: boolean }
 *               sortOrder: { type: integer }
 *     responses:
 *       201:
 *         description: Cinema created
 */
router.post(
  '/',
  authenticate,
  authorizeAdmin,
  createCinemaValidator,
  validate,
  cinemaController.createCinema
);

/**
 * @swagger
 * /api/cinemas/{id}:
 *   put:
 *     tags: [Cinemas]
 *     summary: Update cinema (Admin)
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
 *               cityId: { type: string }
 *               address: { type: string }
 *               isActive: { type: boolean }
 *               sortOrder: { type: integer }
 *     responses:
 *       200:
 *         description: Cinema updated
 */
router.put(
  '/:id',
  authenticate,
  authorizeAdmin,
  updateCinemaValidator,
  validate,
  cinemaController.updateCinema
);

/**
 * @swagger
 * /api/cinemas/{id}:
 *   delete:
 *     tags: [Cinemas]
 *     summary: Soft delete cinema (Admin)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Cinema deleted
 */
router.delete(
  '/:id',
  authenticate,
  authorizeAdmin,
  cinemaIdValidator,
  validate,
  cinemaController.deleteCinema
);

export default router;
