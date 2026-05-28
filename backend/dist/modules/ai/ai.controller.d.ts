import type { Request, Response, NextFunction } from "express";
export declare const aiController: {
    getMemories(req: Request, res: Response, next: NextFunction): Promise<void>;
    addMemory(req: Request, res: Response, next: NextFunction): Promise<void>;
    deleteMemory(req: Request, res: Response, next: NextFunction): Promise<void>;
    summarizeContact(req: Request, res: Response, next: NextFunction): Promise<void>;
    suggestReply(req: Request, res: Response, next: NextFunction): Promise<void>;
    getSuggestion(req: Request, res: Response, next: NextFunction): Promise<void>;
    generateSuggestionDirect(req: Request, res: Response, next: NextFunction): Promise<void>;
};
//# sourceMappingURL=ai.controller.d.ts.map