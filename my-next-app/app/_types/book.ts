export interface BookRecommendation {
    id: string;
    title: string;
    author: string;
    description: string;
    query: string;
    userId: string;
    recommendationDate: string;
    productId?: number;
}
