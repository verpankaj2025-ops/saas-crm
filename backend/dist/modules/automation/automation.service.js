"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.automationService = void 0;
const automation_repository_1 = require("./automation.repository");
const errors_1 = require("../../lib/errors");
exports.automationService = {
    async list(ctx, filter) {
        return automation_repository_1.automationRepository.findAll(ctx, filter);
    },
    async get(ctx, id) {
        const rule = await automation_repository_1.automationRepository.findById(ctx, id);
        if (!rule)
            throw new errors_1.NotFoundError("Automation rule");
        return rule;
    },
    async create(ctx, dto) {
        return automation_repository_1.automationRepository.create(ctx, dto);
    },
    async update(ctx, id, dto) {
        await exports.automationService.get(ctx, id);
        return automation_repository_1.automationRepository.update(ctx, id, dto);
    },
    async toggle(ctx, id) {
        const rule = await exports.automationService.get(ctx, id);
        return automation_repository_1.automationRepository.update(ctx, id, { is_active: !rule.is_active });
    },
    async delete(ctx, id) {
        await exports.automationService.get(ctx, id);
        await automation_repository_1.automationRepository.softDelete(ctx, id);
    },
};
//# sourceMappingURL=automation.service.js.map