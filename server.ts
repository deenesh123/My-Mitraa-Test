/**
 * MyMitraa TaskFlow - Development Server & Spring Boot Reverse Proxy
 * 
 * Mandated Architecture:
 * 1. Java Spring Boot is the sole authoritative backend (com.mymitraa.taskflow).
 * 2. MongoDB is the application's only database (mymitraa_taskflow).
 * 3. This Node.js server acts strictly as a frontend development support server
 *    and transparent reverse proxy to the Spring Boot backend on port 8080.
 * 4. No second database or JSON-backed persistence is maintained here.
 */

import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';

import { apiRouter } from './src/server/apiRouter.ts';

// Authoritative Spring Boot backend target
// Only proxy if an external backend is explicitly configured via environment variable
const CONFIGURED_BACKEND = (process.env.BACKEND_API_BASE_URL || '').trim().replace(/\/$/, '');
const BACKEND_API_BASE_URL = CONFIGURED_BACKEND;
const HAS_CONFIGURED_BACKEND = Boolean(CONFIGURED_BACKEND);

// Helper to differentiate business writes from SearchVM-backed query/read endpoints
function isWriteEndpoint(method: string, path: string): boolean {
  const m = method.toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(m)) return false;

  const clean = path.toLowerCase();
  if (m === 'PUT') {
    if (
      clean.includes('/getall') ||
      clean.includes('/get_all') ||
      clean.includes('/advance_search') ||
      clean.includes('/get_with_pagination') ||
      clean.includes('/dashboard') ||
      clean.includes('/download')
    ) {
      return false; // Search/read query!
    }
  }

  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(m);
}

// Parse incoming payloads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Gracefully normalize accidental /api/api/* URL prefixes to /api/*
app.use((req, _res, next) => {
  if (req.url.startsWith('/api/api/')) {
    req.url = req.url.replace(/^\/api\/api\//, '/api/');
  }
  next();
});

// Transparent Reverse Proxy to Authoritative Spring Boot Backend
app.all('/api/*', async (req: Request, res: Response, next) => {
  const isWrite = isWriteEndpoint(req.method, req.path);
  const isDevAuth = req.path === '/api/auth/login' || req.path === '/api/auth/logout';

  // In production, NEVER fall through to read-only fallback or mock data:
  if (process.env.NODE_ENV === 'production' && !HAS_CONFIGURED_BACKEND) {
    return res.status(503).json({
      code: 503,
      statusCode: 503,
      error: 'Backend Service Unavailable',
      message: 'No authoritative Spring Boot backend configured for production. Mock data is disabled in production.',
      data: null,
    });
  }

  // If no external backend is configured in development:
  if (!HAS_CONFIGURED_BACKEND) {
    if (isWrite && !isDevAuth) {
      // Reject write operations to prevent fake in-memory persistence
      return res.status(503).json({
        code: 503,
        statusCode: 503,
        error: 'Backend Service Unavailable',
        message: 'Authoritative Spring Boot backend is offline. Write operation rejected to prevent unpersisted data loss.',
        data: null,
      });
    }

    // For read operations and dev preview login, pass through to read-only seed data with warning header
    res.setHeader('X-Backend-Authoritative', 'false');
    res.setHeader('X-Datasource', 'Read-Only-Fallback');
    return next();
  }

  // Prevent recursive proxy loops
  if (req.headers['x-taskflow-proxy']) {
    return next();
  }

  const targetUrl = `${BACKEND_API_BASE_URL}${req.url}`;
  const forwardHeaders: Record<string, string> = {
    'x-taskflow-proxy': 'true',
  };
  for (const [key, value] of Object.entries(req.headers)) {
    if (value && !['host', 'connection', 'content-length'].includes(key.toLowerCase())) {
      forwardHeaders[key] = Array.isArray(value) ? value.join(', ') : value;
    }
  }
  if (req.is('json') && !forwardHeaders['content-type']) {
    forwardHeaders['content-type'] = 'application/json';
  }
  const hasBody = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && req.body && Object.keys(req.body).length > 0;

  try {
    const backendRes = await fetch(targetUrl, {
      method: req.method,
      headers: forwardHeaders,
      body: hasBody ? JSON.stringify(req.body) : undefined,
      signal: AbortSignal.timeout(3000),
    });

    const contentType = backendRes.headers.get('content-type') || '';
    const isHtmlResponse = contentType.includes('text/html');

    // If external backend returned 5xx or HTML error page (e.g. gateway error), handle gracefully
    if (backendRes.status >= 500 || (isHtmlResponse && backendRes.status >= 400)) {
      if (process.env.NODE_ENV === 'production' || (isWrite && !isDevAuth)) {
        return res.status(503).json({
          code: 503,
          statusCode: 503,
          error: 'Backend Service Unavailable',
          message: `Authoritative Spring Boot backend at ${BACKEND_API_BASE_URL} returned error status ${backendRes.status}.`,
          data: null,
        });
      }
      res.setHeader('X-Backend-Authoritative', 'false');
      res.setHeader('X-Datasource', 'Read-Only-Fallback');
      return next();
    }

    backendRes.headers.forEach((val, key) => {
      if (!['transfer-encoding', 'content-encoding'].includes(key.toLowerCase())) {
        res.setHeader(key, val);
      }
    });

    res.status(backendRes.status);
    if (contentType.includes('application/json')) {
      return res.json(await backendRes.json());
    } else {
      return res.send(await backendRes.text());
    }
  } catch {
    // Spring Boot backend is unreachable
    if (process.env.NODE_ENV === 'production' || (isWrite && !isDevAuth)) {
      return res.status(503).json({
        code: 503,
        statusCode: 503,
        error: 'Backend Service Unavailable',
        message: `Authoritative Spring Boot backend is offline at ${BACKEND_API_BASE_URL || '127.0.0.1:8080'}. Production requests cannot fall back to mock data.`,
        data: null,
      });
    }

    // For read operations and dev preview login in development, fall through to read-only seed data with warning header
    res.setHeader('X-Backend-Authoritative', 'false');
    res.setHeader('X-Datasource', 'Read-Only-Fallback');
    return next();
  }
});

// Mock API router configuration: strictly disabled in production
if (process.env.NODE_ENV === 'production') {
  app.use('/api', (_req: Request, res: Response) => {
    return res.status(503).json({
      code: 503,
      statusCode: 503,
      error: 'Backend Proxy Required in Production',
      message: 'In production, /api requests must be routed directly to the authoritative Spring Boot backend on 127.0.0.1:8080 (via Nginx reverse proxy). Mock API router is disabled in production.',
      data: null,
    });
  });
} else {
  // Read-only fallback API router for layout visualization in development
  app.use('/api', apiRouter);
}

/**
 * Frontend Development & Production Serving
 */
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`🚀 MyMitraa TaskFlow frontend dev server running at http://${HOST}:${PORT}`);
    console.log(`🔗 Authoritative Reverse Proxy configured to Spring Boot: ${BACKEND_API_BASE_URL}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
