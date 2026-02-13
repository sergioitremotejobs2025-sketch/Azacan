"use server";
import { revalidatePath } from "next/cache";
import { createBookRecommendation, deleteBookRecommendation } from "../api/book";
import { BookRecommendation } from "../_types/book";
import { getSession } from "../_lib/session";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";

export type ActionState = {
    error?: string;
    success?: string;
};

// Function to fetch recommendations from Django API
const fetchRecommendationsFromDjango = async (query: string, userId: string): Promise<BookRecommendation[]> => {
    try {
        const backendUrl = process.env.BACKEND_API_URL || "http://localhost:8000";
        const response = await axios.post(`${backendUrl}/api/recommend/query/`, {
            query: query,
            top_k: 5
        });

        const recommendations: any[] = response.data.recommendations;

        return recommendations.map(rec => ({
            id: uuidv4(),
            title: rec.title,
            author: rec.author || "Unknown Author",
            description: rec.description || rec.reason || "No description available.",
            query: query,
            userId: userId,
            recommendationDate: new Date().toISOString(),
            productId: rec.product_id || rec.productId
        }));
    } catch (error) {
        console.error("Error fetching from Django API:", error);
        throw error;
    }
};

export const searchBooksAction = async (
    prevState: ActionState | null,
    formData: FormData
): Promise<ActionState> => {
    const user = await getSession();
    if (!user) {
        return { error: "User not authenticated" };
    }

    const query = formData.get("query") as string;
    if (!query || query.trim().length === 0) {
        return { error: "Please enter a search query" };
    }

    try {
        const recommendations = await fetchRecommendationsFromDjango(query, user.id.toString());

        if (recommendations.length === 0) {
            return { error: "No recommendations found. Try a different query." };
        }

        // Store all recommendations
        await Promise.all(recommendations.map(book => createBookRecommendation(book)));

        revalidatePath("/books");
        return { success: `Generated ${recommendations.length} recommendations for "${query}"` };
    } catch (error) {
        console.log("error generating book recommendations", error);
        return { error: "Error generating recommendations from AI" };
    }
}

export const saveRecommendationsAction = async (
    query: string,
    recommendationsJson: string
): Promise<ActionState> => {
    const user = await getSession();
    if (!user) return { error: "User not authenticated" };

    try {
        // Parse the JSON list of reasons
        let reasons: string[] = [];
        try {
            // Strip any <think>...</think> blocks and Markdown code blocks
            const cleanJson = recommendationsJson
                .replace(/<think>[\s\S]*?<\/think>/g, "")
                .replace(/```json/g, "")
                .replace(/```/g, "")
                .trim();

            try {
                reasons = JSON.parse(cleanJson);
            } catch (err) {
                // Fallback: If strict JSON fails, try to extract strings manually
                console.warn("Standard JSON parse failed, attempting regex fallback for AI reasoning:", err);
                // Matches strings in double quotes, handling escaped quotes
                const matches = cleanJson.match(/"([^"\\]*(?:\\.[^"\\]*)*)"/g);
                if (matches && matches.length > 0) {
                    reasons = matches.map(m => m.slice(1, -1).replace(/\\"/g, '"'));
                } else {
                    throw new Error("Could not extract valid reasons from AI response");
                }
            }
        } catch (e) {
            console.error("Failed to parse streamed JSON:", e);
            // Even if parsing fails completely, we should try to save the books without reasons
            // rather than failing the whole operation.
            reasons = [];
        }

        // We still need to fetch the similar books from Django to get the titles/authors
        // Or better, let's just use the fetchRecommendationsFromDjango which already does this.
        let recommendations: BookRecommendation[] = [];
        try {
            recommendations = await fetchRecommendationsFromDjango(query, user.id.toString());
        } catch (fetchError) {
            console.error("Failed to fetch formal recommendations from backend:", fetchError);
            return { error: "Failed to connect to AI backend for saving" };
        }

        if (recommendations.length === 0) {
            return { error: "No recommendations found to save" };
        }

        // Save books SEQUENTIALLY to avoid JSON server write conflicts
        // This is much more stable for small file-based databases
        for (const book of recommendations) {
            try {
                await createBookRecommendation(book);
                // Tiny delay to allow JSON server to finish writing/reloading
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (saveError) {
                console.error(`Failed to save book "${book.title}":`, saveError);
                // We'll continue anyway for other books, but maybe notify at end
            }
        }

        revalidatePath("/books");
        return { success: `Successfully processed ${recommendations.length} recommendations` };
    } catch (error: any) {
        console.error("General error in saveRecommendationsAction:", error);
        return { error: `Error saving recommendations: ${error.message || "Unknown error"}` };
    }
}

export const deleteBookAction = async (
    prevState: ActionState | null,
    formData: FormData
): Promise<ActionState> => {
    const id = formData.get("id") as string;
    try {
        await deleteBookRecommendation(id);
        revalidatePath("/books");
        return { success: "Recommendation removed" };
    } catch (error) {
        console.log("error deleting book", error);
        return { error: "Error removing recommendation" };
    }
}