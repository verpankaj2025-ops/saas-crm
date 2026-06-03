import type { Request, Response, NextFunction } from "express";
import { leadsService } from "./leads.service";
import { sendSuccess, sendCreated, sendNoContent, sendPaginated } from "../../lib/response";
import type { WorkspaceContext } from "../../types/common";

const ctx = (req: Request): WorkspaceContext => ({
  workspaceId: req.workspaceId,
  userId: req.user.sub,
  role: req.user.role,
});

export const leadsController = {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const r = await leadsService.list(ctx(req), req.query as never);
      sendPaginated(res, r.data, {
        page: r.page, limit: r.limit, total: r.total, totalPages: Math.ceil(r.total / r.limit),
      });
    } catch (err) { next(err); }
  },
  async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { sendSuccess(res, await leadsService.get(ctx(req), req.params.id)); } catch (err) { next(err); }
  },
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { sendCreated(res, await leadsService.create(ctx(req), req.body as never)); } catch (err) { next(err); }
  },
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { sendSuccess(res, await leadsService.update(ctx(req), req.params.id, req.body as never)); } catch (err) { next(err); }
  },
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { await leadsService.delete(ctx(req), req.params.id); sendNoContent(res); } catch (err) { next(err); }
  },
};
