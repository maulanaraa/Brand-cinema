import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller';

const router = Router();

/**
 * @swagger
 * /api/payments/midtrans/notification:
 *   get:
 *     tags: [Payments]
 *     summary: Midtrans webhook ping (health check)
 *     responses:
 *       200:
 *         description: Webhook endpoint is reachable
 *   post:
 *     tags: [Payments]
 *     summary: Midtrans payment notification webhook
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
 * /api/payments/methods:
 *   get:
 *     tags: [Payments]
 *     summary: List supported payment methods
 *     responses:
 *       200:
 *         description: Payment method options
 */
router.get('/methods', paymentController.getPaymentMethods);

/**
 * @swagger
 * /api/payments/midtrans-config:
 *   get:
 *     tags: [Payments]
 *     summary: Get public Midtrans client config
 *     responses:
 *       200:
 *         description: Midtrans client key and environment flags
 */
router.get('/midtrans-config', paymentController.getMidtransConfig);

export default router;
