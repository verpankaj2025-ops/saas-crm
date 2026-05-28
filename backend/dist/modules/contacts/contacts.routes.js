"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contactsRouter = void 0;
const express_1 = require("express");
const contacts_controller_1 = require("./contacts.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const tenant_middleware_1 = require("../../middleware/tenant.middleware");
const validate_middleware_1 = require("../../middleware/validate.middleware");
const contacts_validation_1 = require("./contacts.validation");
exports.contactsRouter = (0, express_1.Router)();
exports.contactsRouter.use(auth_middleware_1.authMiddleware, tenant_middleware_1.tenantMiddleware);
// ── Workspace-level tag routes (MUST precede /:id to avoid conflict) ──
exports.contactsRouter.get("/tags", contacts_controller_1.contactsController.listTags);
exports.contactsRouter.post("/tags", (0, validate_middleware_1.validate)(contacts_validation_1.CreateTagSchema), contacts_controller_1.contactsController.createTag);
// ── Contact CRUD ──────────────────────────────────────────────
exports.contactsRouter.get("/", (0, validate_middleware_1.validate)(contacts_validation_1.ContactFilterSchema, "query"), contacts_controller_1.contactsController.list);
exports.contactsRouter.post("/", (0, validate_middleware_1.validate)(contacts_validation_1.CreateContactSchema), contacts_controller_1.contactsController.create);
exports.contactsRouter.get("/:id", contacts_controller_1.contactsController.get);
exports.contactsRouter.patch("/:id", (0, validate_middleware_1.validate)(contacts_validation_1.UpdateContactSchema), contacts_controller_1.contactsController.update);
exports.contactsRouter.delete("/:id", contacts_controller_1.contactsController.delete);
// ── Contact ↔ tag ─────────────────────────────────────────────
exports.contactsRouter.post("/:id/tags", (0, validate_middleware_1.validate)(contacts_validation_1.AddTagSchema), contacts_controller_1.contactsController.addTag);
exports.contactsRouter.delete("/:id/tags/:tagId", contacts_controller_1.contactsController.removeTag);
// ── Contact notes ─────────────────────────────────────────────
exports.contactsRouter.get("/:id/notes", contacts_controller_1.contactsController.listNotes);
exports.contactsRouter.post("/:id/notes", (0, validate_middleware_1.validate)(contacts_validation_1.CreateNoteSchema), contacts_controller_1.contactsController.createNote);
exports.contactsRouter.patch("/:id/notes/:noteId", (0, validate_middleware_1.validate)(contacts_validation_1.UpdateNoteSchema), contacts_controller_1.contactsController.updateNote);
exports.contactsRouter.delete("/:id/notes/:noteId", contacts_controller_1.contactsController.deleteNote);
//# sourceMappingURL=contacts.routes.js.map