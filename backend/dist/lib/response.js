"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPaginated = exports.sendNoContent = exports.sendCreated = exports.sendSuccess = void 0;
const sendSuccess = (res, data, statusCode = 200, meta) => res.status(statusCode).json({ success: true, data, ...(meta && { meta }) });
exports.sendSuccess = sendSuccess;
const sendCreated = (res, data) => (0, exports.sendSuccess)(res, data, 201);
exports.sendCreated = sendCreated;
const sendNoContent = (res) => res.status(204).send();
exports.sendNoContent = sendNoContent;
const sendPaginated = (res, data, meta) => (0, exports.sendSuccess)(res, data, 200, meta);
exports.sendPaginated = sendPaginated;
//# sourceMappingURL=response.js.map