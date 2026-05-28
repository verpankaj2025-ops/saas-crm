export interface TokenPayload {
    sub: string;
    workspaceId: string;
    role: string;
    type: "access" | "refresh";
}
type PayloadInput = Omit<TokenPayload, "type">;
export declare const signAccessToken: (payload: PayloadInput) => string;
export declare const signRefreshToken: (payload: PayloadInput) => string;
export declare const verifyAccessToken: (token: string) => TokenPayload;
export declare const verifyRefreshToken: (token: string) => TokenPayload;
export {};
//# sourceMappingURL=jwt.d.ts.map