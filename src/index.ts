import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { config } from 'dotenv';
import { Elysia } from 'elysia';
import { elysiaFault } from 'elysia-fault';
import { rateLimit, type Options } from 'elysia-rate-limit';
import { Logestic } from 'logestic';
import pino from 'pino';
import { libraryRoute, musicRoute } from './routes';
import { createSuccessResponse, createErrorResponse } from './lib/response';

config();

export const logger = pino();
const rateLimit_value = parseInt(process.env.RATE_LIMIT ?? '0');

let app = new Elysia()
  .use(cors())
  .use(Logestic.preset('fancy'))
  .use(
    elysiaFault({
      found: (error) =>
        createErrorResponse('ERR_NOT_FOUND', 'Could not find the route you are looking for.', {
          url: error.url,
          method: error.method
        })
    })
  )
  .use(
    swagger({
      path: '/docs',
      documentation: {
        info: {
          title: 'Keygenmusic API',
          version: '1.0.0',
          description: "An API to fetch music and it's data from keygenmusic.tk"
        }
      }
    })
  );
if (rateLimit_value > 0) {
  const ratelimitOptions: Partial<Options> = {
    max: rateLimit_value,
    errorResponse: 'Rate limit exceeded. Please try again later.'
  };
  app = app.use(rateLimit(ratelimitOptions));
}

app.get('/', () => {
  return createSuccessResponse(undefined, 'KeygenmusicAPI is online!');
});

app.group('/api', (apiEndpoints) => {
  // eslint-disable-next-line prettier/prettier
  return apiEndpoints
    .group('/lib', (a) => a.use(libraryRoute))
    .group('/music', (a) => a.use(musicRoute))
});

app.listen(process.env.PORT == null ? 3000 : Number.parseInt(process.env.PORT));

logger.info(`KeygenmusicAPI is running on port ${process.env.PORT ?? '3000'}`);
