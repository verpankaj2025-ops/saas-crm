"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
const errors_1 = require("../lib/errors");
/**
 * Factory that returns an Express middleware which validates req[target]
 * against a Zod schema and replaces it with the parsed (coerced) value.
 *
 * Usage:
 *   router.post("/", validate(CreateContactSchema), contactsController.create)
 */
function validate(schema, target = "body") {
    return (req, _res, next) => {
        const result = schema.safeParse(req[target]);
        if (!result.success) {
            const formatted = result.error.flatten().fieldErrors;
            return next(new errors_1.ValidationError("Validation failed", formatted));
        }
        req[target] = result.data;
        next();
    };
}
//# sourceMappingURL=validate.middleware.js.map