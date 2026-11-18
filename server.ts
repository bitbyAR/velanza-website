import path from 'node:path';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createApiApp } from './server/app';

const PORT = Number(process.env.PORT || 3000);

async function startServer() {
  const app = createApiApp();

  // Vite or Static Production Middleware
  if (process.env.NODE_ENV === 'production') {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Velanza.co Working & Learning Studio running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Velanza server:', err);
  process.exit(1);
});
