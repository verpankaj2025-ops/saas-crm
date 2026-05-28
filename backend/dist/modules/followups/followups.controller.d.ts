import type { Request, Response, NextFunction } from "express";
export declare const followupsController: {
    list(req: Request, res: Response, next: NextFunction): Promise<void>;
    get(req: Request, res: Response, next: NextFunction): Promise<void>;
    create(req: Request, res: Response, next: NextFunction): Promise<void>;
    update(req: Request, res: Response, next: NextFunction): Promise<void>;
    complete(req: Request, res: Response, next: NextFunction): Promise<void>;
    snooze(req: Request, res: Response, next: NextFunction): Promise<void>;
    cancel(req: Request, res: Response, next: NextFunction): Promise<void>;
    delete(req: Request, res: Response, next: NextFunction): Promise<void>;
};
//# sourceMappingURL=followups.controller.d.ts.map