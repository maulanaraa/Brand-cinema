import { Router } from 'express';
import authRoutes from './auth.routes';
import movieRoutes from './movie.routes';
import showtimeRoutes from './showtime.routes';
import bookingRoutes from './booking.routes';
import adminRoutes from './admin.routes';
import paymentRoutes from './payment.routes';
import concessionRoutes from './concession.routes';
import hallRoutes from './hall.routes';
import cityRoutes from './city.routes';
import cinemaRoutes from './cinema.routes';
import mediaRoutes from './media.routes';
import carouselRoutes from './carousel.routes';
import userRoutes from './user.routes';
import chatRoutes from './chat.routes';
import * as paymentController from '../controllers/payment.controller';

const router = Router();

router.use('/auth', authRoutes);
router.use('/movies', movieRoutes);
router.use('/showtimes', showtimeRoutes);
router.use('/bookings', bookingRoutes);
router.use('/admin', adminRoutes);
router.use('/payments', paymentRoutes);
router.use('/concessions', concessionRoutes);
router.use('/halls', hallRoutes);
router.use('/cities', cityRoutes);
router.use('/cinemas', cinemaRoutes);
router.use('/media', mediaRoutes);
router.use('/carousel', carouselRoutes);
router.use('/users', userRoutes);
router.use('/chat', chatRoutes);

/**
 * @swagger
 * /api/midtrans/notification:
 *   get:
 *     tags: [Payments]
 *     summary: Midtrans webhook ping (alias)
 *     responses:
 *       200:
 *         description: Webhook endpoint is reachable
 *   post:
 *     tags: [Payments]
 *     summary: Midtrans payment notification webhook (alias)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Midtrans notification payload
 *     responses:
 *       200:
 *         description: Notification received
 */
router.get('/midtrans/notification', paymentController.midtransNotificationPing);
router.post('/midtrans/notification', paymentController.midtransNotification);

/**
 * @swagger
 * /api/payment/methods:
 *   get:
 *     tags: [Payments]
 *     summary: List supported payment methods (alias)
 *     responses:
 *       200:
 *         description: Payment method options
 */
router.get('/payment/methods', paymentController.getPaymentMethods);

/**
 * @swagger
 * /api/payment/midtrans-config:
 *   get:
 *     tags: [Payments]
 *     summary: Get public Midtrans client config (alias)
 *     responses:
 *       200:
 *         description: Midtrans client key and environment flags
 */
router.get('/payment/midtrans-config', paymentController.getMidtransConfig);

export default router;
