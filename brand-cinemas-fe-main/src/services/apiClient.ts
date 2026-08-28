import type { ApiResponse, ApiSuccessResponse } from '@/types/auth';
import { getApiBaseUrl } from '@/config/api';

const API_URL = getApiBaseUrl();

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors: string[] = [],
    public unavailableSeats: string[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function assertJsonResponse(res: Response): void {
  const contentType = res.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    throw new ApiError(
      res.status,
      res.status >= 500
        ? 'Server error. Please try again later.'
        : 'Unexpected server response. Check API URL configuration.',
    );
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiSuccessResponse<T>> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  assertJsonResponse(res);

  let body: ApiResponse<T>;
  try {
    body = await res.json();
  } catch {
    throw new ApiError(res.status, 'Unexpected server response');
  }

  if (!body.success) {
    const errorBody = body as { message: string; errors?: string[]; unavailableSeats?: string[] };
    throw new ApiError(
      res.status,
      errorBody.message,
      errorBody.errors ?? [],
      errorBody.unavailableSeats ?? [],
    );
  }

  return body;
}

export async function apiFormRequest<T>(
  path: string,
  method: 'POST' | 'PUT',
  formData: FormData,
): Promise<ApiSuccessResponse<T>> {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    credentials: 'include',
    body: formData,
  });

  assertJsonResponse(res);

  let body: ApiResponse<T>;
  try {
    body = await res.json();
  } catch {
    throw new ApiError(res.status, 'Unexpected server response');
  }

  if (!body.success) {
    const errorBody = body as { message: string; errors?: string[]; unavailableSeats?: string[] };
    throw new ApiError(
      res.status,
      errorBody.message,
      errorBody.errors ?? [],
      errorBody.unavailableSeats ?? [],
    );
  }

  return body;
}
