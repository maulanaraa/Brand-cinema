import { Router } from 'express';
import * as bookingController from '../controllers/booking.controller';
import * as dashboardController from '../controllers/dashboard.controller';
import { authenticate, authorizeAdmin, validate } from '../middlewares';
import { adminBookingQueryValidator, adminBookingStatusValidator } from '../validators';

const router = Router();

/**
 * @swagger
 * /api/admin/bookings:
 *   get:
 *     tags: [Admin]
 *     summary: List all bookings (Admin)
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
 *         name: bookingStatus
 *         schema: { type: string, enum: [PENDING, CONFIRMED, CANCELLED, EXPIRED] }
 *       - in: query
 *         name: paymentStatus
 *         schema: { type: string, enum: [PENDING, SUCCESS, FAILED] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
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
 *         description: All bookings
 */
router.get(
  '/bookings',
  authenticate,
  authorizeAdmin,
  adminBookingQueryValidator,
  validate,
  bookingController.getAdminBookings
);

/**
 * @swagger
 * /api/admin/bookings/{id}/status:
 *   patch:
 *     tags: [Admin]
 *     summary: Update booking status (Admin)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bookingStatus: { type: string, enum: [PENDING, CONFIRMED, CANCELLED, EXPIRED] }
 *               paymentStatus: { type: string, enum: [PENDING, SUCCESS, FAILED] }
 *     responses:
 *       200:
 *         description: Booking status updated
 */
router.patch(
  '/bookings/:id/status',
  authenticate,
  authorizeAdmin,
  adminBookingStatusValidator,
  validate,
  bookingController.updateAdminBookingStatus
);

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     tags: [Admin]
 *     summary: Get dashboard statistics (Admin)
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats
 */
router.get('/dashboard', authenticate, authorizeAdmin, dashboardController.getDashboard);

export default router;
