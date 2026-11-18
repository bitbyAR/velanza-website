import type { IncomingMessage, ServerResponse } from 'node:http';
import { createApiApp } from '../server/app';

const app = createApiApp();

export default function handler(
  req: IncomingMessage & { url?: string },
  res: ServerResponse,
) {
  if (req.url) {
    const parsed = new URL(req.url, 'http://localhost');
    const rewrittenPath = parsed.searchParams.get('__path');
    if (rewrittenPath) {
      parsed.searchParams.delete('__path');
      const remainingQuery = parsed.searchParams.toString();
      req.url = rewrittenPath + (remainingQuery ? `?${remainingQuery}` : '');
    }
  }
  return app(req as never, res as never);
}
