import type { Request, Response, NextFunction } from "express";
export declare const templatesController: {
    list(req: Request, res: Response, next: NextFunction): Promise<void>;
    get(req: Request, res: Response, next: NextFunction): Promise<void>;
    create(req: Request, res: Response, next: NextFunction): Promise<void>;
    update(req: Request, res: Response, next: NextFunction): Promise<void>;
    delete(req: Request, res: Response, next: NextFunction): Promise<void>;
    markUsed(req: Request, res: Response, next: NextFunction): Promise<void>;
    syncApproval(req: Request, res: Response, next: NextFunction): Promise<void>;
};
//# sourceMappingURL=templates.controller.d.ts.map