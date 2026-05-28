import type { Request, Response, NextFunction } from "express";
import { memoryService } from "./memory.service";
import { validate } from "../../middleware/validate.middleware";
import { sendSuccess, sendCreated } from "../../lib/response";
import type { WorkspaceContext } from "../../types/common";
import { UpdatePreferencesSchema, RefreshLeadScoreSchema, GenerateSummarySchema } from "./memory.validation";

const ctx = (req: Request): WorkspaceContext => ({ workspaceId: req.workspaceId, userId: req.user.sub, role: req.user.role });

export const memoryController = {
  async getPreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await memoryService.getPreferences(ctx(req), req.params.id));
    } catch (err) { next(err); }
  },

  async updatePreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await memoryService.updatePreferences(ctx(req), req.params.id, req.body));
    } catch (err) { next(err); }
  },

  async getLeadScore(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await memoryService.getLeadScore(ctx(req), req.params.id));
    } catch (err) { next(err); }
  },

  async refreshLeadScore(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await memoryService.refreshLeadScore(ctx(req), req.params.id));
    } catch (err) { next(err); }
  },

  async getConversationSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const summary = await memoryService.generateConversationSummary(ctx(req), req.params.id);
      sendSuccess(res, summary);
    } catch (err) { next(err); }
  },

  async getInteractionSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const summary = await memoryService.generateInteractionSummary(ctx(req), req.params.id);
      sendSuccess(res, summary);
    } catch (err) { next(err); }
  },

  async getCustomerInsights(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await memoryService.getCustomerInsights(ctx(req), req.params.id));
    } catch (err) { next(err); }
  },

  async getAiContext(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const context = await memoryService.buildAiContext(ctx(req), req.params.id);
      sendSuccess(res, { context });
    } catch (err) { next(err); }
  },
};
