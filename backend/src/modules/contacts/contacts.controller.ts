import type { Request, Response, NextFunction } from "express";
import { contactsService } from "./contacts.service";
import { sendSuccess, sendCreated, sendNoContent, sendPaginated } from "../../lib/response";
import type { WorkspaceContext } from "../../types/common";

const ctx = (req: Request): WorkspaceContext => ({
  workspaceId: req.workspaceId,
  userId:      req.user.sub,
  role:        req.user.role,
});

export const contactsController = {

  // ── Contacts ────────────────────────────────────────────────

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await contactsService.list(ctx(req), req.query as never);
      sendPaginated(res, result.data, {
        page: result.page, limit: result.limit,
        total: result.total, totalPages: Math.ceil(result.total / result.limit),
      });
    } catch (err) { next(err); }
  },

  async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await contactsService.get(ctx(req), req.params.id));
    } catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendCreated(res, await contactsService.create(ctx(req), req.body as never));
    } catch (err) { next(err); }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await contactsService.update(ctx(req), req.params.id, req.body as never));
    } catch (err) { next(err); }
  },

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await contactsService.delete(ctx(req), req.params.id);
      sendNoContent(res);
    } catch (err) { next(err); }
  },

  // ── Workspace tags ───────────────────────────────────────────

  async listTags(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await contactsService.listTags(ctx(req)));
    } catch (err) { next(err); }
  },

  async createTag(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendCreated(res, await contactsService.createTag(ctx(req), req.body as never));
    } catch (err) { next(err); }
  },

  async addTag(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tag_id } = req.body as { tag_id: string };
      await contactsService.addTag(ctx(req), req.params.id, tag_id);
      res.status(204).send();
    } catch (err) { next(err); }
  },

  async removeTag(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await contactsService.removeTag(ctx(req), req.params.id, req.params.tagId);
      sendNoContent(res);
    } catch (err) { next(err); }
  },

  // ── Notes ─────────────────────────────────────────────────────

  async listNotes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await contactsService.listNotes(ctx(req), req.params.id));
    } catch (err) { next(err); }
  },

  async createNote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendCreated(res, await contactsService.createNote(ctx(req), req.params.id, req.body as never));
    } catch (err) { next(err); }
  },

  async updateNote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await contactsService.updateNote(ctx(req), req.params.id, req.params.noteId, req.body as never));
    } catch (err) { next(err); }
  },

  async deleteNote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await contactsService.deleteNote(ctx(req), req.params.id, req.params.noteId);
      sendNoContent(res);
    } catch (err) { next(err); }
  },
};
