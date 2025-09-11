"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfileSchema = exports.changePasswordSchema = exports.resetPasswordSchema = exports.emailSchema = exports.refreshTokenSchema = exports.registerSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string().min(1, 'Password is required'),
    companySlug: zod_1.z.string().optional(),
});
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters long'),
    firstName: zod_1.z.string().min(1, 'First name is required').max(50, 'First name too long'),
    lastName: zod_1.z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
    companyName: zod_1.z.string().min(1, 'Company name is required').max(100, 'Company name too long'),
    companySlug: zod_1.z.string()
        .min(3, 'Company slug must be at least 3 characters')
        .max(50, 'Company slug too long')
        .regex(/^[a-z0-9-]+$/, 'Company slug can only contain lowercase letters, numbers, and hyphens'),
});
exports.refreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1, 'Refresh token is required'),
});
exports.emailSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
});
exports.resetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, 'Reset token is required'),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters long'),
});
exports.changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1, 'Current password is required'),
    newPassword: zod_1.z.string().min(8, 'New password must be at least 8 characters long'),
});
exports.updateProfileSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1, 'First name is required').max(50, 'First name too long').optional(),
    lastName: zod_1.z.string().min(1, 'Last name is required').max(50, 'Last name too long').optional(),
});
//# sourceMappingURL=validation.js.map