import { serve } from '@hono/node-server';
import { config as loadEnv } from 'dotenv';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

loadEnv({ path: path.join(__dirname, '.env') });

const HONO_PORT = Number(process.env.HONO_PORT || 8787);
const FASTAPI_BASE_URL = String(process.env.FASTAPI_BASE_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');

const app = new Hono();

app.use(
  '*',
  cors({
    origin: '*',
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  }),
);

function buildUpstreamUrl(requestUrl) {
  const url = new URL(requestUrl);
  return `${FASTAPI_BASE_URL}${url.pathname}${url.search}`;
}

async function proxyToFastAPI(c) {
  const targetUrl = buildUpstreamUrl(c.req.url);
  const headers = new Headers(c.req.raw.headers);
  headers.set('host', new URL(FASTAPI_BASE_URL).host);

  const init = {
    method: c.req.method,
    headers,
    redirect: 'manual',
  };

  if (!['GET', 'HEAD'].includes(c.req.method)) {
    init.body = await c.req.raw.arrayBuffer();
  }

  let upstreamResponse;
  try {
    upstreamResponse = await fetch(targetUrl, init);
  } catch (error) {
    throw new HTTPException(502, {
      message: 'FastAPI upstream tidak dapat dijangkau',
      res: c.json(
        {
          success: false,
          gateway: 'hono',
          message: 'FastAPI upstream tidak dapat dijangkau',
          detail: error instanceof Error ? error.message : 'Unknown gateway error',
          upstream: FASTAPI_BASE_URL,
        },
        502,
      ),
    });
  }

  const responseHeaders = new Headers(upstreamResponse.headers);
  responseHeaders.delete('content-encoding');
  responseHeaders.delete('content-length');

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: responseHeaders,
  });
}

app.get('/', (c) =>
  c.json({
    success: true,
    gateway: 'hono',
    message: 'Hono gateway aktif',
    routes: {
      health: '/health-js',
      fastapiHealth: '/health-fastapi',
      proxyApi: '/api/*',
      proxyUploads: '/uploads/*',
    },
    upstream: FASTAPI_BASE_URL,
  }),
);

app.get('/health-js', (c) =>
  c.json({
    success: true,
    gateway: 'hono',
    message: 'Hono gateway aktif',
    upstream: FASTAPI_BASE_URL,
  }),
);

app.get('/health-fastapi', async (c) => {
  try {
    const response = await fetch(`${FASTAPI_BASE_URL}/health`);
    const payload = await response.json().catch(() => null);
    return c.json(
      {
        success: response.ok,
        gateway: 'hono',
        upstream: FASTAPI_BASE_URL,
        status: response.status,
        data: payload,
      },
      response.ok ? 200 : 502,
    );
  } catch (error) {
    return c.json(
      {
        success: false,
        gateway: 'hono',
        upstream: FASTAPI_BASE_URL,
        message: 'FastAPI upstream tidak dapat dijangkau',
        detail: error instanceof Error ? error.message : 'Unknown gateway error',
      },
      502,
    );
  }
});

app.all('/api/*', proxyToFastAPI);
app.all('/uploads/*', proxyToFastAPI);

app.onError((error, c) => {
  if (error instanceof HTTPException) {
    return error.getResponse();
  }

  return c.json(
    {
      success: false,
      gateway: 'hono',
      message: error instanceof Error ? error.message : 'Unexpected gateway error',
    },
    500,
  );
});

export function startGateway() {
  return serve(
    {
      fetch: app.fetch,
      port: HONO_PORT,
    },
    (info) => {
      console.log(`Hono gateway running on http://localhost:${info.port}`);
      console.log(`Proxying /api/* to ${FASTAPI_BASE_URL}`);
    },
  );
}

export { app, FASTAPI_BASE_URL, HONO_PORT };

if (process.argv[1] === __filename) {
  startGateway();
}
