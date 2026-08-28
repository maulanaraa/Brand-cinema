import { Response, NextFunction } from 'express';
import { chatService, ChatMessage } from '../services/chat.service';
import { AuthenticatedRequest, asyncHandler } from '../helpers';
import { sendSuccess } from '../helpers/response.helper';
import { MESSAGES } from '../constants';

/**
 * POST /api/chat
 * Body: { message: string, history?: { role: 'user'|'assistant', content: string }[] }
 * Response: { success, message, data: { reply: string } }
 */
export const postChat = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    const { message, history } = req.body as {
      message: string;
      history?: ChatMessage[];
    };

    const reply = await chatService.chat(message, Array.isArray(history) ? history : []);

    sendSuccess(res, MESSAGES.SUCCESS, { reply });
  }
);
