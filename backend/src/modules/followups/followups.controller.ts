import type { Request, Response, NextFunction } from "express";
import { followupsService } from "./followups.service";
import { sendSuccess, sendCreated, sendNoContent, sendPaginated } from "../../lib/response";
import type { WorkspaceContext } from "../../types/common";
import type { SnoozeFollowupDto } from "./followups.types";

const ctx = (req: Request): WorkspaceContext => ({
  workspaceId: req.workspaceId,
  userId: req.user.sub,
  role: req.user.role,
});

export const followupsController = {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const r = await followupsService.list(ctx(req), req.query as never);
      sendPaginated(res, r.data, { page: r.page, limit: r.limit, total: r.total, totalPages: Math.ceil(r.total / r.limit) });
    } catch (err) { next(err); }
  },

  async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { sendSuccess(res, await followupsService.get(ctx(req), req.params.id)); }
    catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { sendCreated(res, await followupsService.create(ctx(req), req.body as never)); }
    catch (err) { next(err); }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { sendSuccess(res, await followupsService.update(ctx(req), req.params.id, req.body as never)); }
    catch (err) { next(err); }
  },

  async complete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { sendSuccess(res, await followupsService.complete(ctx(req), req.params.id)); }
    catch (err) { next(err); }
  },

  async snooze(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await followupsService.snooze(ctx(req), req.params.id, req.body as SnoozeFollowupDto));
    } catch (err) { next(err); }
  },

  async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { sendSuccess(res, await followupsService.cancel(ctx(req), req.params.id)); }
    catch (err) { next(err); }
  },

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { await followupsService.delete(ctx(req), req.params.id); sendNoContent(res); }
    catch (err) { next(err); }
  },
};
