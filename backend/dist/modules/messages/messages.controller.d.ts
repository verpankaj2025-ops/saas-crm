import type { Request, Response, NextFunction } from "express";
export declare const messagesController: {
    list(req: Request, res: Response, next: NextFunction): Promise<void>;
    get(req: Request, res: Response, next: NextFunction): Promise<void>;
    send(req: Request, res: Response, next: NextFunction): Promise<void>;
    retry(req: Request, res: Response, next: NextFunction): Promise<void>;
};
//# sourceMappingURL=messages.controller.d.ts.map