export interface GraphQLContext {
    user?: import('./auth').User;
    company?: import('./auth').Company;
    isAuthenticated: boolean;
    req: import('express').Request;
    res: import('express').Response;
}
export interface PaginationInput {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}
export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    errors?: string[];
}
//# sourceMappingURL=graphql.d.ts.map