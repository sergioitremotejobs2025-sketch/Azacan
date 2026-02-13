export interface BookRecommendation {
    id: string;
    title: string;
    author: string;
    description: string;
    query: string;
    userId: string;
    recommendationDate: string;
    productId?: number;
    originalId?: number; // Backend Book ID for feedback
}
