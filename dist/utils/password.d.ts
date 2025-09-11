export declare class PasswordService {
    static hash(password: string): Promise<string>;
    static compare(password: string, hashedPassword: string): Promise<boolean>;
    static validatePasswordStrength(password: string): {
        isValid: boolean;
        errors: string[];
    };
}
//# sourceMappingURL=password.d.ts.map