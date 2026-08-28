import '../src/config/dns';
import { createApp } from '../src/app';
import { connectDatabase } from '../src/config/database';
import { Request, Response } from 'express';

const app = createApp();

export default async function handler(req: Request, res: Response) {
  await connectDatabase();
  return app(req, res);
}
