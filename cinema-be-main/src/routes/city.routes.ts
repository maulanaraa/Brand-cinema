import { Router } from 'express';
import * as cityController from '../controllers/city.controller';
import { authenticate, authorizeAdmin, optionalAuthenticate, validate } from '../middlewares';
import {
  cityQueryValidator,
  cityIdValidator,
  createCityValidator,
  updateCityValidator,
} from '../validators';

const router = Router();

/**
 * @swagger
 * /api/cities:
 *   get:
 *     tags: [Cities]
 *     summary: List cities
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
 *         schema: { type: string, enum: [name, sortOrder, createdAt] }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc] }
 *       - in: query
 *         name: isActive
 *         schema: { type: string, enum: [true, false, all] }
 *     responses:
 *       200:
 *         description: City list
 */
router.get('/', optionalAuthenticate, cityQueryValidator, validate, cityController.getCities);

/**
 * @swagger
 * /api/cities/{id}:
 *   get:
 *     tags: [Cities]
 *     summary: Get city by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: City details
 *       404:
 *         description: City not found
 */
router.get('/:id', optionalAuthenticate, cityIdValidator, validate, cityController.getCityById);

/**
 * @swagger
 * /api/cities:
 *   post:
 *     tags: [Cities]
 *     summary: Create city (Admin)
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               slug: { type: string }
 *               isActive: { type: boolean }
 *               sortOrder: { type: integer }
 *     responses:
 *       201:
 *         description: City created
 */
router.post(
  '/',
  authenticate,
  authorizeAdmin,
  createCityValidator,
  validate,
  cityController.createCity
);

/**
 * @swagger
 * /api/cities/{id}:
 *   put:
 *     tags: [Cities]
 *     summary: Update city (Admin)
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
 *               slug: { type: string }
 *               isActive: { type: boolean }
 *               sortOrder: { type: integer }
 *     responses:
 *       200:
 *         description: City updated
 */
router.put(
  '/:id',
  authenticate,
  authorizeAdmin,
  updateCityValidator,
  validate,
  cityController.updateCity
);

/**
 * @swagger
 * /api/cities/{id}:
 *   delete:
 *     tags: [Cities]
 *     summary: Soft delete city (Admin)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: City deleted
 */
router.delete(
  '/:id',
  authenticate,
  authorizeAdmin,
  cityIdValidator,
  validate,
  cityController.deleteCity
);

export default router;
