import axios from "axios";
import { BookRecommendation } from "../_types/book";

const API_URL = process.env.JSON_SERVER_URL || "http://localhost:3002";

export const getBooks = async (userId: string) => {
    const response = await axios.get(`${API_URL}/books?userId=${userId}`);
    return response.data as BookRecommendation[];
}

export const getBookById = async (bookId: string) => {
    const response = await axios.get(`${API_URL}/books/${bookId}`);
    return response.data as BookRecommendation;
}

export const createBookRecommendation = async (book: BookRecommendation) => {
    const response = await axios.post(`${API_URL}/books`, book);
    return response.data;
}

export const updateBookRecommendation = async (id: string, book: Partial<BookRecommendation>) => {
    const response = await axios.patch(`${API_URL}/books/${id}`, book);
    return response.data;
}

export const deleteBookRecommendation = async (bookId: string) => {
    const response = await axios.delete(`${API_URL}/books/${bookId}`);
    return response.data;
}
