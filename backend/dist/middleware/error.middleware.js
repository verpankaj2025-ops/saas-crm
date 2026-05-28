"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = errorMiddleware;
const errors_1 = require("../lib/errors");
const logger_1 = require("../lib/logger");
function errorMiddleware(err, req, res, _next) {
    if ((0, errors_1.isAppError)(err)) {
        if (err.statusCode >= 500) {
            logger_1.logger.error(err.message, { stack: err.stack, path: req.path });
        }
        res.status(err.statusCode).json({
            success: false,
            error: err.message,
            code: err.code,
        });
        return;
    }
    // Unhandled / unknown error
    logger_1.logger.error("Unhandled error", {
        err,
        path: req.path,
        method: req.method,
    });
    res.status(500).json({
        success: false,
        error: "Internal server error",
        code: "INTERNAL_ERROR",
    });
}
//# sourceMappingURL=error.middleware.js.map