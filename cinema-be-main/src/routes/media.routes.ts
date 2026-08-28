import { Router } from 'express';
import * as mediaController from '../controllers/media.controller';

const router = Router();

/**
 * @swagger
 * /api/media/image:
 *   get:
 *     tags: [Media]
 *     summary: Proxy remote image (e.g. Google Drive)
 *     parameters:
 *       - in: query
 *         name: url
 *         required: true
 *         schema: { type: string, format: uri }
 *         description: Remote image URL to fetch and stream
 *     responses:
 *       200:
 *         description: Image binary streamed
 *         content:
 *           image/*:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Invalid or unsafe URL
 */
router.get('/image', mediaController.proxyImage);

export default router;
