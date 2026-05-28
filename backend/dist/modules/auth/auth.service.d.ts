import type { LoginInput, RegisterInput } from "./auth.validation";
import type { AuthSession } from "./auth.types";
export declare const authService: {
    register(dto: RegisterInput): Promise<AuthSession>;
    login(dto: LoginInput): Promise<AuthSession>;
    refresh(refreshToken: string): Promise<AuthSession>;
    logout(refreshToken: string): Promise<void>;
};
//# sourceMappingURL=auth.service.d.ts.map