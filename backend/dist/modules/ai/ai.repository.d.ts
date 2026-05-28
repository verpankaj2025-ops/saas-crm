import type { UUID, WorkspaceContext } from "../../types/common";
import type { AiMemory, CreateMemoryDto } from "./ai.types";
export declare const aiRepository: {
    findMemories(ctx: WorkspaceContext, entityType: string, entityId: UUID, limit?: number): Promise<AiMemory[]>;
    create(ctx: WorkspaceContext, dto: CreateMemoryDto, source?: string): Promise<AiMemory>;
    delete(ctx: WorkspaceContext, id: UUID): Promise<void>;
};
//# sourceMappingURL=ai.repository.d.ts.map