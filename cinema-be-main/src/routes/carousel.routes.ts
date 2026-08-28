import { Router } from 'express';
import * as carouselController from '../controllers/carousel.controller';
import { authenticate, authorizeAdmin, optionalAuthenticate, validate } from '../middlewares';
import {
  carouselQueryValidator,
  carouselIdValidator,
  createCarouselValidator,
  updateCarouselValidator,
  reorderCarouselValidator,
} from '../validators';

const router = Router();

/**
 * @swagger
 * /api/carousel/active:
 *   get:
 *     tags: [Carousel]
 *     summary: List active carousel items (public)
 *     responses:
 *       200:
 *         description: Active carousel banners
 */
router.get('/active', carouselController.getActiveCarousel);

/**
 * @swagger
 * /api/carousel:
 *   get:
 *     tags: [Carousel]
 *     summary: List carousel items
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
 *         name: type
 *         schema: { type: string, enum: [movie, promotion] }
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [order, createdAt, title] }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc] }
 *       - in: query
 *         name: isActive
 *         schema: { type: string, enum: [true, false, all] }
 *     responses:
 *       200:
 *         description: Carousel list
 */
router.get(
  '/',
  optionalAuthenticate,
  carouselQueryValidator,
  validate,
  carouselController.getCarouselItems
);

/**
 * @swagger
 * /api/carousel/reorder:
 *   put:
 *     tags: [Carousel]
 *     summary: Reorder carousel items (Admin)
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderedIds]
 *             properties:
 *               orderedIds:
 *                 type: array
 *                 minItems: 1
 *                 items: { type: string }
 *     responses:
 *       200:
 *         description: Carousel reordered
 */
router.put(
  '/reorder',
  authenticate,
  authorizeAdmin,
  reorderCarouselValidator,
  validate,
  carouselController.reorderCarousel
);

/**
 * @swagger
 * /api/carousel/{id}:
 *   get:
 *     tags: [Carousel]
 *     summary: Get carousel item by ID (Admin)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Carousel item details
 *       404:
 *         description: Carousel item not found
 */
router.get(
  '/:id',
  authenticate,
  authorizeAdmin,
  carouselIdValidator,
  validate,
  carouselController.getCarouselById
);

/**
 * @swagger
 * /api/carousel:
 *   post:
 *     tags: [Carousel]
 *     summary: Create carousel item (Admin)
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type, title, imageUrl]
 *             properties:
 *               type: { type: string, enum: [movie, promotion] }
 *               title: { type: string, minLength: 1, maxLength: 200 }
 *               description: { type: string }
 *               imageUrl: { type: string, description: Absolute URL, /uploads/... path, or data:image URL }
 *               linkUrl: { type: string }
 *               movieId: { type: string, nullable: true }
 *               isActive: { type: boolean }
 *               order: { type: integer, minimum: 0 }
 *     responses:
 *       201:
 *         description: Carousel item created
 */
router.post(
  '/',
  authenticate,
  authorizeAdmin,
  createCarouselValidator,
  validate,
  carouselController.createCarousel
);

/**
 * @swagger
 * /api/carousel/{id}:
 *   put:
 *     tags: [Carousel]
 *     summary: Update carousel item (Admin)
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
 *               type: { type: string, enum: [movie, promotion] }
 *               title: { type: string, minLength: 1, maxLength: 200 }
 *               description: { type: string }
 *               imageUrl: { type: string }
 *               linkUrl: { type: string }
 *               movieId: { type: string, nullable: true }
 *               isActive: { type: boolean }
 *               order: { type: integer, minimum: 0 }
 *     responses:
 *       200:
 *         description: Carousel item updated
 */
router.put(
  '/:id',
  authenticate,
  authorizeAdmin,
  updateCarouselValidator,
  validate,
  carouselController.updateCarousel
);

/**
 * @swagger
 * /api/carousel/{id}:
 *   delete:
 *     tags: [Carousel]
 *     summary: Soft delete carousel item (Admin)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Carousel item deleted
 */
router.delete(
  '/:id',
  authenticate,
  authorizeAdmin,
  carouselIdValidator,
  validate,
  carouselController.deleteCarousel
);

export default router;
