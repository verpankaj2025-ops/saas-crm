import type { Request, Response, NextFunction } from "express";
import { messagesService } from "./messages.service";
import { sendSuccess, sendCreated } from "../../lib/response";
import type { WorkspaceContext } from "../../types/common";

const ctx = (req: Request): WorkspaceContext => ({
  workspaceId: req.workspaceId,
  userId: req.user.sub,
  role: req.user.role,
});

export const messagesController = {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await messagesService.list(ctx(req), req.query as never));
    } catch (err) { next(err); }
  },

  async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await messagesService.get(ctx(req), req.params.id));
    } catch (err) { next(err); }
  },

  async send(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendCreated(res, await messagesService.send(ctx(req), req.body as never));
    } catch (err) { next(err); }
  },

  async retry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await messagesService.retry(ctx(req), req.params.id));
    } catch (err) { next(err); }
  },
};
