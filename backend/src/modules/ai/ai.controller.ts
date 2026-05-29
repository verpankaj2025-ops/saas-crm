import type { Request, Response, NextFunction } from "express";
import { aiService } from "./ai.service";
import { sendSuccess, sendCreated, sendNoContent } from "../../lib/response";
import type { WorkspaceContext } from "../../types/common";
import type { SuggestionRequest } from "./ai.types";
import type { SuggestionQueryInput } from "./ai.validation";

const ctx = (req: Request): WorkspaceContext => ({ workspaceId: req.workspaceId, userId: req.user.sub, role: req.user.role });

export const aiController = {
  async getMemories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await aiService.getMemories(ctx(req), req.params.entityType, req.params.entityId));
    } catch (err) { next(err); }
  },

  async addMemory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { sendCreated(res, await aiService.addMemory(ctx(req), req.body as never)); } catch (err) { next(err); }
  },

  async deleteMemory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { await aiService.deleteMemory(ctx(req), req.params.id); sendNoContent(res); } catch (err) { next(err); }
  },

  async summarizeContact(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { sendSuccess(res, await aiService.requestContactSummary(ctx(req), req.params.id)); } catch (err) { next(err); }
  },

  async suggestReply(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { sendSuccess(res, await aiService.requestReplySuggestion(ctx(req), req.params.id)); } catch (err) { next(err); }
  },

  async getSuggestion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tone, force_ai } = req.query as unknown as SuggestionQueryInput;
      const request: SuggestionRequest = { conversation_id: req.params.id, tone, force_ai };
      sendSuccess(res, await aiService.getSuggestion(ctx(req), request));
    } catch (err) { next(err); }
  },

  async generateSuggestionDirect(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tone } = req.query as unknown as SuggestionQueryInput;
      const suggestion = await aiService.generateSuggestionDirect(ctx(req), req.params.id, tone);
      sendSuccess(res, { suggestion });
    } catch (err) { next(err); }
  },
};
