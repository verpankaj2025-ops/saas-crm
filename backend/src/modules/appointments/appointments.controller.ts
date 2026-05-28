import type { Request, Response, NextFunction } from "express";
import { appointmentsService } from "./appointments.service";
import { sendSuccess, sendCreated, sendNoContent, sendPaginated } from "../../lib/response";
import type { WorkspaceContext } from "../../types/common";

const ctx = (req: Request): WorkspaceContext => ({
  workspaceId: req.workspaceId,
  userId: req.user.sub,
  role: req.user.role,
});

export const appointmentsController = {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const r = await appointmentsService.list(ctx(req), req.query as never);
      sendPaginated(res, r.data, { page: r.page, limit: r.limit, total: r.total, totalPages: Math.ceil(r.total / r.limit) });
    } catch (err) { next(err); }
  },

  async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { sendSuccess(res, await appointmentsService.get(ctx(req), req.params.id)); }
    catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { sendCreated(res, await appointmentsService.create(ctx(req), req.body as never)); }
    catch (err) { next(err); }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { sendSuccess(res, await appointmentsService.update(ctx(req), req.params.id, req.body as never)); }
    catch (err) { next(err); }
  },

  async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { sendSuccess(res, await appointmentsService.cancel(ctx(req), req.params.id)); }
    catch (err) { next(err); }
  },

  async complete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { sendSuccess(res, await appointmentsService.complete(ctx(req), req.params.id)); }
    catch (err) { next(err); }
  },

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { await appointmentsService.delete(ctx(req), req.params.id); sendNoContent(res); }
    catch (err) { next(err); }
  },
};
