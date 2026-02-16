export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface FilterOptions {
  status?: string;
  category?: string;
  dateRange?: DateRange;
  searchTerm?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
