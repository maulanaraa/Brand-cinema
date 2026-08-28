export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export enum MovieStatus {
  NOW_PLAYING = 'NOW_PLAYING',
  COMING_SOON = 'COMING_SOON',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export enum PaymentMethod {
  SIMULATION = 'SIMULATION',
  MIDTRANS = 'MIDTRANS',
}

export interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
  jti: string;
  tv: number;
}

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors: string[];
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface DashboardStats {
  totalUsers: number;
  totalMovies: number;
  totalShowtimes: number;
  totalBookings: number;
  latestBookings: unknown[];
  latestMovies: unknown[];
  latestShowtimes: unknown[];
}
