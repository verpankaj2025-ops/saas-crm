import type { Response } from "express";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  meta?: PaginationMeta | Record<string, unknown>;
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: ApiResponse["meta"]
): Response =>
  res.status(statusCode).json({ success: true, data, ...(meta && { meta }) });

export const sendCreated = <T>(res: Response, data: T): Response =>
  sendSuccess(res, data, 201);

export const sendNoContent = (res: Response): Response =>
  res.status(204).send();

export const sendPaginated = <T>(
  res: Response,
  data: T[],
  meta: PaginationMeta
): Response => sendSuccess(res, data, 200, meta);
