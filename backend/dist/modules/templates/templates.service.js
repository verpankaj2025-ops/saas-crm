"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.templatesService = void 0;
const templates_repository_1 = require("./templates.repository");
const errors_1 = require("../../lib/errors");
function substituteVariables(body, context) {
    return body.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return context[key] || match;
    });
}
exports.templatesService = {
    async list(ctx, filter) {
        return templates_repository_1.templatesRepository.findAll(ctx, filter);
    },
    async get(ctx, id) {
        const tmpl = await templates_repository_1.templatesRepository.findById(ctx, id);
        if (!tmpl)
            throw new errors_1.NotFoundError("Template");
        return tmpl;
    },
    async create(ctx, dto) {
        return templates_repository_1.templatesRepository.create(ctx, dto);
    },
    async update(ctx, id, dto) {
        await exports.templatesService.get(ctx, id);
        return templates_repository_1.templatesRepository.update(ctx, id, dto);
    },
    async delete(ctx, id) {
        await exports.templatesService.get(ctx, id);
        await templates_repository_1.templatesRepository.softDelete(ctx, id);
    },
    async markUsed(ctx, id) {
        await templates_repository_1.templatesRepository.markUsed(ctx, id);
    },
    async applyTemplate(ctx, id, context) {
        const tmpl = await exports.templatesService.get(ctx, id);
        return substituteVariables(tmpl.body, context);
    },
    // ── Safe variable substitution with sanitization ────────────────
    async applyTemplateSafe(ctx, id, context) {
        const tmpl = await exports.templatesService.get(ctx, id);
        // Sanitize context values to prevent injection
        const sanitizedContext = {};
        for (const [key, value] of Object.entries(context)) {
            if (value) {
                // Remove any HTML/script tags
                sanitizedContext[key] = value
                    .replace(/<[^>]*>/g, "")
                    .replace(/javascript:/gi, "")
                    .replace(/on\w+=/gi, "")
                    .trim();
            }
        }
        return substituteVariables(tmpl.body, sanitizedContext);
    },
    async syncApproval(_ctx, _id) {
        // TODO: call WhatsApp Cloud API to check template approval status
        return { status: "pending_approval" };
    },
};
//# sourceMappingURL=templates.service.js.map