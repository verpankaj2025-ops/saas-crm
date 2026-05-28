import type { Request, Response, NextFunction } from "express";
export declare const memoryController: {
    getPreferences(req: Request, res: Response, next: NextFunction): Promise<void>;
    updatePreferences(req: Request, res: Response, next: NextFunction): Promise<void>;
    getLeadScore(req: Request, res: Response, next: NextFunction): Promise<void>;
    refreshLeadScore(req: Request, res: Response, next: NextFunction): Promise<void>;
    getConversationSummary(req: Request, res: Response, next: NextFunction): Promise<void>;
    getInteractionSummary(req: Request, res: Response, next: NextFunction): Promise<void>;
    getCustomerInsights(req: Request, res: Response, next: NextFunction): Promise<void>;
    getAiContext(req: Request, res: Response, next: NextFunction): Promise<void>;
};
//# sourceMappingURL=memory.controller.d.ts.map