import type { Response } from "express";

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export function success<T>(res: Response, message: string, data: T, pagination?: Pagination, statusCode: number = 200): void {
  res.status(statusCode).json({
    success: true,
    message,
    data,
    ...(pagination ? { pagination } : {})
  });
}

export function error(
  res: Response,
  statusCode: number,
  message: string,
  errors?: Array<{ field: string; message: string }>
): void {
  res.status(statusCode).json({
    success: false,
    message,
    ...(errors ? { errors } : {})
  }
  );
}
