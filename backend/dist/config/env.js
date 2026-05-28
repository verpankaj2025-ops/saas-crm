"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(["development", "test", "production"]).default("development"),
    PORT: zod_1.z.coerce.number().default(4000),
    SUPABASE_URL: zod_1.z.string().url(),
    SUPABASE_SERVICE_ROLE_KEY: zod_1.z.string().min(1),
    DATABASE_URL: zod_1.z.string().url(),
    JWT_ACCESS_SECRET: zod_1.z.string().min(32),
    JWT_REFRESH_SECRET: zod_1.z.string().min(32),
    JWT_ACCESS_EXPIRES_IN: zod_1.z.string().default("15m"),
    JWT_REFRESH_EXPIRES_IN: zod_1.z.string().default("7d"),
    REDIS_URL: zod_1.z.string().default("redis://localhost:6379"),
    CORS_ORIGINS: zod_1.z.string().default("http://localhost:3000"),
    WHATSAPP_API_URL: zod_1.z.string().url().optional(),
    WHATSAPP_TOKEN: zod_1.z.string().optional(),
    WHATSAPP_PHONE_NUMBER_ID: zod_1.z.string().optional(),
    WHATSAPP_VERIFY_TOKEN: zod_1.z.string().optional(),
    WHATSAPP_APP_SECRET: zod_1.z.string().optional(),
    OPENAI_API_KEY: zod_1.z.string().optional(),
    OPENAI_EMBEDDING_MODEL: zod_1.z.string().default("text-embedding-3-small"),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error("❌  Invalid environment variables:\n", JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
    process.exit(1);
}
exports.env = parsed.data;
//# sourceMappingURL=env.js.map