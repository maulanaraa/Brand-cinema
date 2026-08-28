import { Router } from 'express';
import * as showtimeController from '../controllers/showtime.controller';
import { authenticate, authorizeAdmin, validate } from '../middlewares';
import {
  createShowtimeValidator,
  updateShowtimeValidator,
  showtimeIdValidator,
  showtimeQueryValidator,
  showtimeDatesQueryValidator,
} from '../validators';

const router = Router();

/**
 * @swagger
 * /api/showtimes:
 *   get:
 *     tags: [Showtimes]
 *     summary: List showtimes
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100 }
 *       - in: query
 *         name: movieId
 *         schema: { type: string }
 *       - in: query
 *         name: date
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: sort
 *         schema: { type: string }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc] }
 *     responses:
 *       200:
 *         description: Showtime list
 */
router.get('/', showtimeQueryValidator, validate, showtimeController.getShowtimes);

/**
 * @swagger
 * /api/showtimes/dates:
 *   get:
 *     tags: [Showtimes]
 *     summary: List available showtime dates
 *     parameters:
 *       - in: query
 *         name: cityId
 *         schema: { type: string }
 *       - in: query
 *         name: cinemaId
 *         schema: { type: string }
 *       - in: query
 *         name: days
 *         schema: { type: integer, default: 7 }
 *     responses:
 *       200:
 *         description: Available dates
 */
router.get(
  '/dates',
  showtimeDatesQueryValidator,
  validate,
  showtimeController.getAvailableDates
);

/**
 * @swagger
 * /api/showtimes/{id}:
 *   get:
 *     tags: [Showtimes]
 *     summary: Get showtime by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Showtime details
 */
router.get('/:id', showtimeIdValidator, validate, showtimeController.getShowtimeById);

/**
 * @swagger
 * /api/showtimes/{id}/seats:
 *   get:
 *     tags: [Showtimes]
 *     summary: Get seat availability for a showtime
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Seat map
 */
router.get('/:id/seats', showtimeIdValidator, validate, showtimeController.getShowtimeSeats);

/**
 * @swagger
 * /api/showtimes:
 *   post:
 *     tags: [Showtimes]
 *     summary: Create showtime (Admin)
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [movieId, studio, date, time, price, totalSeat]
 *             properties:
 *               movieId: { type: string }
 *               studio: { type: string }
 *               date: { type: string, format: date }
 *               time: { type: string, example: '19:30', description: HH:mm format }
 *               price: { type: number, minimum: 0 }
 *               totalSeat: { type: integer, minimum: 1 }
 *     responses:
 *       201:
 *         description: Showtime created
 */
router.post(
  '/',
  authenticate,
  authorizeAdmin,
  createShowtimeValidator,
  validate,
  showtimeController.createShowtime
);

/**
 * @swagger
 * /api/showtimes/{id}:
 *   put:
 *     tags: [Showtimes]
 *     summary: Update showtime (Admin)
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
 *               movieId: { type: string }
 *               studio: { type: string }
 *               date: { type: string, format: date }
 *               time: { type: string, example: '19:30', description: HH:mm format }
 *               price: { type: number, minimum: 0 }
 *               totalSeat: { type: integer, minimum: 1 }
 *     responses:
 *       200:
 *         description: Showtime updated
 */
router.put(
  '/:id',
  authenticate,
  authorizeAdmin,
  updateShowtimeValidator,
  validate,
  showtimeController.updateShowtime
);

/**
 * @swagger
 * /api/showtimes/{id}:
 *   delete:
 *     tags: [Showtimes]
 *     summary: Soft delete showtime (Admin)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Showtime deleted
 */
router.delete(
  '/:id',
  authenticate,
  authorizeAdmin,
  showtimeIdValidator,
  validate,
  showtimeController.deleteShowtime
);

export default router;
