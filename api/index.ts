import type { IncomingMessage, ServerResponse } from 'http';
import { createApp } from '../server';

// The Express app is created once per warm serverless instance and reused.
let appPromise: Promise<any> | null = null;

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
) {
  if (!appPromise) appPromise = createApp();
  const app = await appPromise;
  return app(req, res);
}
