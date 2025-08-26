export declare class CategoryService {
    static getAllCategories(): Promise<any>;
    static getCategoryBySlug(slug: string): Promise<any>;
    static joinCategory(userId: string, categoryId: string): Promise<any>;
    static leaveCategory(userId: string, categoryId: string): Promise<any>;
    static getUserCategories(userId: string): Promise<any>;
}
//# sourceMappingURL=category.service.d.ts.map