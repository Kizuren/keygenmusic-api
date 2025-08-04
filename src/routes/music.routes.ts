import { Elysia, t } from 'elysia';

import { Music } from '../core';
import { createErrorResponse, createRoutesResponse } from '../lib/response';

const musicRoute = new Elysia();

musicRoute.get('/', () => {
  return Response.json(
    createRoutesResponse({
      message: 'Music routes',
      routes: [
        {
          method: 'GET',
          path: {
            name: '/download/:id'
          },
          params: [
            {
              name: 'id',
              type: 'String',
              description: 'Music ID'
            }
          ],
          description: 'Download the desired music'
        }
      ]
    }),
    418
  );
});

musicRoute.get(
  '/download/:id',
  async ({ params }) => {
    try {
      const { id } = params;

      const downloadUrl = await Music.getDownloadUrl(id);

      if (!downloadUrl) {
        return Response.json(createErrorResponse('NOT_FOUND', 'Music not found'), 404);
      }

      return new Response(null, {
        status: 302,
        headers: {
          Location: downloadUrl
        }
      });
    } catch {
      return Response.json(createErrorResponse('INTERNAL_SERVER_ERROR', 'An internal server error occurred'), 500);
    }
  },
  {
    params: t.Object({
      id: t.String()
    })
  }
);

export { musicRoute };
