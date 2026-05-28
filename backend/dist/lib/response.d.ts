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
export declare const sendSuccess: <T>(res: Response, data: T, statusCode?: number, meta?: ApiResponse["meta"]) => Response;
export declare const sendCreated: <T>(res: Response, data: T) => Response;
export declare const sendNoContent: (res: Response) => Response;
export declare const sendPaginated: <T>(res: Response, data: T[], meta: PaginationMeta) => Response;
//# sourceMappingURL=response.d.ts.map