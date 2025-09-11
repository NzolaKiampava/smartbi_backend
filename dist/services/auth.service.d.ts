import { User, Company, LoginInput, RegisterInput, AuthTokens } from '../types/auth';
export declare class AuthService {
    static login(input: LoginInput): Promise<{
        user: User;
        company: Company;
        tokens: AuthTokens;
    }>;
    static register(input: RegisterInput): Promise<{
        user: User;
        company: Company;
        tokens: AuthTokens;
    }>;
    static refreshToken(refreshToken: string): Promise<AuthTokens>;
    static getUserById(userId: string): Promise<{
        user: User;
        company: Company;
    } | null>;
}
//# sourceMappingURL=auth.service.d.ts.map