import { Router } from "express";
import { authRouter } from "../modules/auth/auth.routes";
import { contactsRouter } from "../modules/contacts/contacts.routes";
import { conversationsRouter } from "../modules/conversations/conversations.routes";
import { messagesRouter } from "../modules/messages/messages.routes";
import { followupsRouter } from "../modules/followups/followups.routes";
import { appointmentsRouter } from "../modules/appointments/appointments.routes";
import { templatesRouter } from "../modules/templates/templates.routes";
import { automationRouter } from "../modules/automation/automation.routes";
import { aiRouter } from "../modules/ai/ai.routes";
import { whatsappRouter } from "../modules/whatsapp/whatsapp.routes";
import memoryRouter from "../modules/memory/memory.routes";

export const apiRouter = Router();

// Public routes
apiRouter.use("/auth", authRouter);

// Webhook receiver (has its own rate limit — see whatsapp.routes.ts)
apiRouter.use("/webhooks/whatsapp", whatsappRouter);

// Protected routes — authMiddleware applied inside each module router
apiRouter.use("/contacts",      contactsRouter);
apiRouter.use("/conversations",  conversationsRouter);
apiRouter.use("/messages",       messagesRouter);
apiRouter.use("/followups",      followupsRouter);
apiRouter.use("/appointments",   appointmentsRouter);
apiRouter.use("/templates",      templatesRouter);
apiRouter.use("/automation",     automationRouter);
apiRouter.use("/ai",             aiRouter);
apiRouter.use("/memory",         memoryRouter);
