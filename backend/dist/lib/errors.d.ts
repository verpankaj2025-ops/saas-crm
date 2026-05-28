export declare class AppError extends Error {
    readonly message: string;
    readonly statusCode: number;
    readonly code: string;
    constructor(message: string, statusCode?: number, code?: string);
}
export declare class NotFoundError extends AppError {
    constructor(resource?: string);
}
export declare class UnauthorizedError extends AppError {
    constructor(message?: string);
}
export declare class ForbiddenError extends AppError {
    constructor(message?: string);
}
export declare class ValidationError extends AppError {
    readonly errors?: Record<string, string[]> | undefined;
    constructor(message?: string, errors?: Record<string, string[]> | undefined);
}
export declare class ConflictError extends AppError {
    constructor(message?: string);
}
export declare class TooManyRequestsError extends AppError {
    constructor(message?: string);
}
export declare const isAppError: (err: unknown) => err is AppError;
//# sourceMappingURL=errors.d.ts.map