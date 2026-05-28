import type { Request, Response, NextFunction } from "express";
import { conversationsService } from "./conversations.service";
import { sendSuccess, sendCreated, sendNoContent, sendPaginated } from "../../lib/response";
import type { WorkspaceContext } from "../../types/common";

const ctx = (req: Request): WorkspaceContext => ({
  workspaceId: req.workspaceId,
  userId: req.user.sub,
  role: req.user.role,
});

export const conversationsController = {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await conversationsService.list(ctx(req), req.query as never);
      sendPaginated(res, result.data, { page: result.page, limit: result.limit, total: result.total, totalPages: Math.ceil(result.total / result.limit) });
    } catch (err) { next(err); }
  },

  async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await conversationsService.get(ctx(req), req.params.id));
    } catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendCreated(res, await conversationsService.create(ctx(req), req.body as never));
    } catch (err) { next(err); }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await conversationsService.update(ctx(req), req.params.id, req.body as never));
    } catch (err) { next(err); }
  },

  async markRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await conversationsService.markRead(ctx(req), req.params.id));
    } catch (err) { next(err); }
  },

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await conversationsService.delete(ctx(req), req.params.id);
      sendNoContent(res);
    } catch (err) { next(err); }
  },
};
