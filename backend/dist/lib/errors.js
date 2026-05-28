"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAppError = exports.TooManyRequestsError = exports.ConflictError = exports.ValidationError = exports.ForbiddenError = exports.UnauthorizedError = exports.NotFoundError = exports.AppError = void 0;
class AppError extends Error {
    message;
    statusCode;
    code;
    constructor(message, statusCode = 500, code = "INTERNAL_ERROR") {
        super(message);
        this.message = message;
        this.statusCode = statusCode;
        this.code = code;
        this.name = "AppError";
        // V8-specific — safe to call once @types/node is installed
        const captureStackTrace = Error["captureStackTrace"];
        if (typeof captureStackTrace === "function") {
            captureStackTrace(this, this.constructor);
        }
    }
}
exports.AppError = AppError;
class NotFoundError extends AppError {
    constructor(resource = "Resource") {
        super(`${resource} not found`, 404, "NOT_FOUND");
    }
}
exports.NotFoundError = NotFoundError;
class UnauthorizedError extends AppError {
    constructor(message = "Unauthorized") {
        super(message, 401, "UNAUTHORIZED");
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends AppError {
    constructor(message = "Access denied") {
        super(message, 403, "FORBIDDEN");
    }
}
exports.ForbiddenError = ForbiddenError;
class ValidationError extends AppError {
    errors;
    constructor(message = "Validation failed", errors) {
        super(message, 422, "VALIDATION_ERROR");
        this.errors = errors;
    }
}
exports.ValidationError = ValidationError;
class ConflictError extends AppError {
    constructor(message = "Resource already exists") {
        super(message, 409, "CONFLICT");
    }
}
exports.ConflictError = ConflictError;
class TooManyRequestsError extends AppError {
    constructor(message = "Too many requests") {
        super(message, 429, "TOO_MANY_REQUESTS");
    }
}
exports.TooManyRequestsError = TooManyRequestsError;
const isAppError = (err) => err instanceof AppError;
exports.isAppError = isAppError;
//# sourceMappingURL=errors.js.map