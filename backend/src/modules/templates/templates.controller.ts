import type { Request, Response, NextFunction } from "express";
import { templatesService } from "./templates.service";
import { sendSuccess, sendCreated, sendNoContent, sendPaginated } from "../../lib/response";
import type { WorkspaceContext } from "../../types/common";

const ctx = (req: Request): WorkspaceContext => ({ workspaceId: req.workspaceId, userId: req.user.sub, role: req.user.role });

export const templatesController = {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const r = await templatesService.list(ctx(req), req.query as never);
      sendPaginated(res, r.data, { page: r.page, limit: r.limit, total: r.total, totalPages: Math.ceil(r.total / r.limit) });
    } catch (err) { next(err); }
  },
  async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { sendSuccess(res, await templatesService.get(ctx(req), req.params.id)); } catch (err) { next(err); }
  },
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { sendCreated(res, await templatesService.create(ctx(req), req.body as never)); } catch (err) { next(err); }
  },
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { sendSuccess(res, await templatesService.update(ctx(req), req.params.id, req.body as never)); } catch (err) { next(err); }
  },
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { await templatesService.delete(ctx(req), req.params.id); sendNoContent(res); } catch (err) { next(err); }
  },
  async markUsed(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { await templatesService.markUsed(ctx(req), req.params.id); sendNoContent(res); } catch (err) { next(err); }
  },
  async syncApproval(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { sendSuccess(res, await templatesService.syncApproval(ctx(req), req.params.id)); } catch (err) { next(err); }
  },
};
