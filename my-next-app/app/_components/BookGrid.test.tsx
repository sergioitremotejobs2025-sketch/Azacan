import { render, screen } from "@testing-library/react";
import BookGrid from "./BookGrid";
import { BookRecommendation } from "../_types/book";

// Mock next/link
jest.mock("next/link", () => {
    return ({ children, href }: { children: React.ReactNode; href: string }) => (
        <a href={href}>{children}</a>
    );
});

describe("BookGrid", () => {
    const mockBooks: BookRecommendation[] = [
        {
            id: "1",
            title: "Test Book",
            author: "Test Author",
            description: "Test Description",
            query: "test query",
            userId: "user-1",
            recommendationDate: new Date().toISOString(),
            productId: 123 // We expect this field to exist
        } as any,
    ];

    it("should render a link to the backend product page", () => {
        render(<BookGrid books={mockBooks} />);

        const backendLinks = screen.getAllByRole("link");
        const backendLink = backendLinks.find(link => link.textContent?.toLowerCase().includes("backend"));

        expect(backendLink).toBeDefined();
        expect(backendLink?.getAttribute("href")).toContain("/product/123");
    });
});
