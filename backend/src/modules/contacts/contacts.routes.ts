import { Router } from "express";
import { contactsController } from "./contacts.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { tenantMiddleware } from "../../middleware/tenant.middleware";
import { validate } from "../../middleware/validate.middleware";
import {
  CreateContactSchema, UpdateContactSchema, ContactFilterSchema,
  CreateTagSchema, AddTagSchema, CreateNoteSchema, UpdateNoteSchema,
} from "./contacts.validation";

export const contactsRouter = Router();

contactsRouter.use(authMiddleware, tenantMiddleware);

// ── Workspace-level tag routes (MUST precede /:id to avoid conflict) ──
contactsRouter.get( "/tags", contactsController.listTags);
contactsRouter.post("/tags", validate(CreateTagSchema), contactsController.createTag);

// ── Contact CRUD ──────────────────────────────────────────────
contactsRouter.get(   "/",    validate(ContactFilterSchema, "query"), contactsController.list);
contactsRouter.post(  "/",    validate(CreateContactSchema),          contactsController.create);
contactsRouter.get(   "/:id",                                         contactsController.get);
contactsRouter.patch( "/:id", validate(UpdateContactSchema),          contactsController.update);
contactsRouter.delete("/:id",                                         contactsController.delete);

// ── Contact ↔ tag ─────────────────────────────────────────────
contactsRouter.post(  "/:id/tags",        validate(AddTagSchema), contactsController.addTag);
contactsRouter.delete("/:id/tags/:tagId",                         contactsController.removeTag);

// ── Contact notes ─────────────────────────────────────────────
contactsRouter.get(   "/:id/notes",              contactsController.listNotes);
contactsRouter.post(  "/:id/notes",              validate(CreateNoteSchema), contactsController.createNote);
contactsRouter.patch( "/:id/notes/:noteId",      validate(UpdateNoteSchema), contactsController.updateNote);
contactsRouter.delete("/:id/notes/:noteId",                                  contactsController.deleteNote);
