import { Router } from 'express';
import * as chatController from '../controllers/chat.controller';
import { chatRateLimiter, validate } from '../middlewares';
import { chatValidator } from '../validators';

const router = Router();

/**
 * @swagger
 * /api/chat:
 *   post:
 *     tags: [Chat]
 *     summary: Ask the cinema chatbot (public)
 *     description: >
 *       RAG chatbot powered by Google Gemini. Uses live movie/concession data
 *       from MongoDB plus FAQ knowledge. No authentication required.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message:
 *                 type: string
 *                 maxLength: 1000
 *                 example: Film apa yang sedang tayang?
 *               history:
 *                 type: array
 *                 description: Optional prior turns for multi-turn conversation
 *                 items:
 *                   type: object
 *                   required: [role, content]
 *                   properties:
 *                     role:
 *                       type: string
 *                       enum: [user, assistant]
 *                     content:
 *                       type: string
 *     responses:
 *       200:
 *         description: Chatbot reply
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     reply: { type: string }
 *       400:
 *         description: Invalid message
 *       429:
 *         description: Rate limit exceeded
 *       502:
 *         description: Upstream AI provider error
 *       503:
 *         description: Chatbot not configured (missing GEMINI_API_KEY)
 */
router.post('/', chatRateLimiter, chatValidator, validate, chatController.postChat);

export default router;
