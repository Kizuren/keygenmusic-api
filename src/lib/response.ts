interface BaseResponse {
  success: boolean;
  timestamp: string;
}

interface SuccessResponse<T> extends BaseResponse {
  success: true;
  data: T;
  message?: string;
}

interface ErrorResponse extends BaseResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

interface RoutesResponse extends BaseResponse {
  message: string;
  routes: Route[];
}

export type ApiResponse<T> = ErrorResponse | SuccessResponse<T>;

function createSuccessResponse<T>(data: T, message?: string): SuccessResponse<T> {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  };
}

function createErrorResponse(code: string, message: string, details?: Record<string, unknown>): ErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      details
    },
    timestamp: new Date().toISOString()
  };
}

function createRoutesResponse(routes: RoutesEnter): RoutesResponse {
  return {
    success: true,
    message: routes.message,
    routes: routes.routes,
    timestamp: new Date().toISOString()
  };
}

interface RoutesEnter {
  message: string;
  routes: Route[];
}

interface Route {
  method: string;
  path: RoutePath;
  params?: RouteParameter[];
  description?: string;
}

interface RoutePath {
  name: string;
  params?: RouteParameter[];
}

interface RouteParameter {
  name: string;
  type: string;
  description?: string;
}

export {
  createErrorResponse,
  createRoutesResponse,
  createSuccessResponse,
  type ErrorResponse,
  type RoutesResponse,
  type SuccessResponse
};
