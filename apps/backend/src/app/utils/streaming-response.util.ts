import type { Response } from 'express';

export const configureStreamingResponse = (res: Response): void => {
  res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.setHeader('Content-Encoding', 'identity');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Cache-Control, Content-Type, Authorization');
  res.flushHeaders();
};

export const flushStreamingResponse = (res: Response): void => {
  const flushable = res as Response & { flush?: () => void };
  if (typeof flushable.flush === 'function') {
    flushable.flush();
  }
};
