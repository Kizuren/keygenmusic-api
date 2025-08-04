import { Elysia, t } from 'elysia';

import { Library } from '../core';
import { arrayEqual } from '../lib/array-helper';
import { createErrorResponse, createRoutesResponse, createSuccessResponse } from '../lib/response';

const libraryRoute = new Elysia();

libraryRoute.get('/', () => {
  return Response.json(
    createRoutesResponse({
      message: 'Library routes',
      routes: [
        {
          method: 'GET',
          path: {
            name: '/search'
          },
          params: [
            {
              name: 'q',
              type: 'String',
              description: 'Search query'
            }
          ],
          description: 'Search for music'
        },
        {
          method: 'GET',
          path: {
            name: '/info/:id',
            params: [
              {
                name: 'id',
                type: 'String',
                description: 'Music ID'
              }
            ]
          },
          description: 'Get details for a music'
        }
      ]
    }),
    418
  );
});

libraryRoute.get(
  '/search',
  async ({ query }) => {
    try {
      const { q } = query;

      if (!q) {
        return Response.json(createErrorResponse('INVALID_PARAMS', 'Query is required'));
      }

      const results = await Library.search(q);

      if (arrayEqual(results, [])) {
        return Response.json(createErrorResponse('NO_RESULTS_FOUND', 'No search result was found'), 404);
      }

      return Response.json(createSuccessResponse(results, 'Successfully fetched search data'));
    } catch {
      return Response.json(createErrorResponse('INTERNAL_SERVER_ERROR', 'An internal server error occurred'), 500);
    }
  },
  {
    query: t.Object({
      q: t.String()
    })
  }
);

libraryRoute.get(
  '/info/:id',
  async ({ params }) => {
    try {
      const { id } = params;

      const info = await Library.info(id);
      if (info == null) return Response.json(createErrorResponse('NO_RESULTS_FOUND', 'No music was found'));

      return Response.json(createSuccessResponse(info, 'Successfully fetched info'));
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

export { libraryRoute };
