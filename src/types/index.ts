import type { UserRole, BookingStatus } from "@/generated/prisma/client";

export type SessionUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
};

export type ApiResponse<T> = {
  data: T;
  message?: string;
};

export type ApiError = {
  error: string;
  details?: Record<string, string[]>;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type BookingFilters = {
  search?: string;
  status?: BookingStatus;
  tourId?: string;
  sellerId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
};

export type DashboardMetrics = {
  todayBookings: number;
  todayRevenue: number;
  pendingConfirmations: number;
  activeTours: number;
  todayBookingsTrend: number;
  todayRevenueTrend: number;
};
