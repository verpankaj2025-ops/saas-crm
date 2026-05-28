"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateNoteSchema = exports.CreateNoteSchema = exports.AddTagSchema = exports.CreateTagSchema = exports.ContactFilterSchema = exports.UpdateContactSchema = exports.CreateContactSchema = void 0;
const zod_1 = require("zod");
exports.CreateContactSchema = zod_1.z.object({
    first_name: zod_1.z.string().min(1).max(100),
    last_name: zod_1.z.string().max(100).optional(),
    email: zod_1.z.string().email().optional(),
    phone: zod_1.z.string().max(30).optional(),
    company: zod_1.z.string().max(150).optional(),
    job_title: zod_1.z.string().max(150).optional(),
    source: zod_1.z.string().max(50).optional(),
    assigned_to: zod_1.z.string().uuid().optional(),
    custom_fields: zod_1.z.record(zod_1.z.unknown()).optional(),
});
exports.UpdateContactSchema = exports.CreateContactSchema.partial().extend({
    status: zod_1.z.enum(["active", "inactive", "archived"]).optional(),
});
exports.ContactFilterSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(25),
    sort_by: zod_1.z.string().optional(),
    sort_dir: zod_1.z.enum(["asc", "desc"]).default("desc"),
    status: zod_1.z.enum(["active", "inactive", "archived"]).optional(),
    assigned_to: zod_1.z.string().uuid().optional(),
    search: zod_1.z.string().max(200).optional(),
    // Express parses ?tag_ids=a&tag_ids=b as array, ?tag_ids=a as string
    tag_ids: zod_1.z.preprocess((v) => (typeof v === "string" ? [v] : v), zod_1.z.array(zod_1.z.string().uuid()).optional()),
});
exports.CreateTagSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(50),
    color: zod_1.z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});
exports.AddTagSchema = zod_1.z.object({
    tag_id: zod_1.z.string().uuid(),
});
exports.CreateNoteSchema = zod_1.z.object({
    content: zod_1.z.string().min(1).max(5000),
    is_pinned: zod_1.z.boolean().optional(),
});
exports.UpdateNoteSchema = zod_1.z.object({
    content: zod_1.z.string().min(1).max(5000).optional(),
    is_pinned: zod_1.z.boolean().optional(),
});
//# sourceMappingURL=contacts.validation.js.map