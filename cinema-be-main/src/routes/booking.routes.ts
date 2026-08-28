import { Router } from 'express';
import * as bookingController from '../controllers/booking.controller';
import {
  authenticate,
  authorizeUser,
  validate,
  bookingRateLimiter,
} from '../middlewares';
import {
  createBookingValidator,
  bookingIdValidator,
  paymentValidator,
  paymentChargeValidator,
  updateBookingConcessionsValidator,
  bookingQueryValidator,
} from '../validators';

const router = Router();

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     tags: [Bookings]
 *     summary: Create a booking
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [showtimeId, selectedSeats]
 *             properties:
 *               showtimeId: { type: string }
 *               selectedSeats:
 *                 type: array
 *                 items: { type: string }
 *     responses:
 *       201:
 *         description: Booking created
 *       409:
 *         description: Seat unavailable
 */
router.post(
  '/',
  authenticate,
  authorizeUser,
  bookingRateLimiter,
  createBookingValidator,
  validate,
  bookingController.createBooking
);

/**
 * @swagger
 * /api/bookings/me:
 *   get:
 *     tags: [Bookings]
 *     summary: Get current user bookings
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
 *         name: sort
 *         schema: { type: string }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc] }
 *     responses:
 *       200:
 *         description: User bookings
 */
router.get(
  '/me',
  authenticate,
  authorizeUser,
  bookingQueryValidator,
  validate,
  bookingController.getMyBookings
);

/**
 * @swagger
 * /api/bookings/{id}:
 *   get:
 *     tags: [Bookings]
 *     summary: Get booking by ID
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Booking details
 */
router.get(
  '/:id',
  authenticate,
  authorizeUser,
  bookingIdValidator,
  validate,
  bookingController.getBookingById
);

/**
 * @swagger
 * /api/bookings/{id}:
 *   delete:
 *     tags: [Bookings]
 *     summary: Cancel a booking
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Booking cancelled
 */
router.delete(
  '/:id',
  authenticate,
  authorizeUser,
  bookingIdValidator,
  validate,
  bookingController.cancelBooking
);

/**
 * @swagger
 * /api/bookings/{id}/concessions:
 *   put:
 *     tags: [Bookings]
 *     summary: Update concessions on a booking
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
 *             required: [concessions]
 *             properties:
 *               concessions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [concessionId, quantity]
 *                   properties:
 *                     concessionId: { type: string }
 *                     quantity: { type: integer, minimum: 1 }
 *     responses:
 *       200:
 *         description: Booking concessions updated
 */
router.put(
  '/:id/concessions',
  authenticate,
  authorizeUser,
  updateBookingConcessionsValidator,
  validate,
  bookingController.updateBookingConcessions
);

/**
 * @swagger
 * /api/bookings/{id}/payment/midtrans:
 *   post:
 *     tags: [Bookings]
 *     summary: Create Midtrans Snap payment token
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Snap token created
 */
router.post(
  '/:id/payment/midtrans',
  authenticate,
  authorizeUser,
  bookingIdValidator,
  validate,
  bookingController.createMidtransPayment
);

/**
 * @swagger
 * /api/bookings/{id}/payment/charge:
 *   post:
 *     tags: [Bookings]
 *     summary: Charge booking via Midtrans Core API
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
 *             required: [paymentMethod]
 *             properties:
 *               paymentMethod:
 *                 type: string
 *                 enum:
 *                   - credit_card
 *                   - gopay
 *                   - shopeepay
 *                   - dana
 *                   - bca_va
 *                   - bni_va
 *                   - bri_va
 *                   - permata_va
 *                   - echannel
 *                   - indomaret
 *                   - alfamart
 *               tokenId:
 *                 type: string
 *                 description: Required when paymentMethod is credit_card
 *               concessions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     concessionId: { type: string }
 *                     quantity: { type: integer, minimum: 1 }
 *     responses:
 *       200:
 *         description: Charge created
 */
router.post(
  '/:id/payment/charge',
  authenticate,
  authorizeUser,
  paymentChargeValidator,
  validate,
  bookingController.chargeBookingPayment
);

/**
 * @swagger
 * /api/bookings/{id}/payment/instruction:
 *   get:
 *     tags: [Bookings]
 *     summary: Get active payment instruction
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Payment instruction details
 */
router.get(
  '/:id/payment/instruction',
  authenticate,
  authorizeUser,
  bookingIdValidator,
  validate,
  bookingController.getBookingPaymentInstruction
);

/**
 * @swagger
 * /api/bookings/{id}/payment/status:
 *   get:
 *     tags: [Bookings]
 *     summary: Get Midtrans payment status for booking
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Payment status
 */
router.get(
  '/:id/payment/status',
  authenticate,
  authorizeUser,
  bookingIdValidator,
  validate,
  bookingController.getMidtransPaymentStatus
);

/**
 * @swagger
 * /api/bookings/{id}/payment:
 *   patch:
 *     tags: [Bookings]
 *     summary: Simulate payment for a booking
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
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [SUCCESS, FAILED]
 *     responses:
 *       200:
 *         description: Payment processed
 */
router.patch(
  '/:id/payment',
  authenticate,
  authorizeUser,
  paymentValidator,
  validate,
  bookingController.processPayment
);

export default router;
