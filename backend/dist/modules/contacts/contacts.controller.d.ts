import type { Request, Response, NextFunction } from "express";
export declare const contactsController: {
    list(req: Request, res: Response, next: NextFunction): Promise<void>;
    get(req: Request, res: Response, next: NextFunction): Promise<void>;
    create(req: Request, res: Response, next: NextFunction): Promise<void>;
    update(req: Request, res: Response, next: NextFunction): Promise<void>;
    delete(req: Request, res: Response, next: NextFunction): Promise<void>;
    listTags(req: Request, res: Response, next: NextFunction): Promise<void>;
    createTag(req: Request, res: Response, next: NextFunction): Promise<void>;
    addTag(req: Request, res: Response, next: NextFunction): Promise<void>;
    removeTag(req: Request, res: Response, next: NextFunction): Promise<void>;
    listNotes(req: Request, res: Response, next: NextFunction): Promise<void>;
    createNote(req: Request, res: Response, next: NextFunction): Promise<void>;
    updateNote(req: Request, res: Response, next: NextFunction): Promise<void>;
    deleteNote(req: Request, res: Response, next: NextFunction): Promise<void>;
};
//# sourceMappingURL=contacts.controller.d.ts.map