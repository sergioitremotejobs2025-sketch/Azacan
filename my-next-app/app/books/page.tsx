import React from "react";
import { getSession } from "../_lib/session";
import { redirect } from "next/navigation";
import { getBooks } from "../api/book";
import BookGrid from "../_components/BookGrid";
import QueryList from "../_components/QueryList";
import Pagination from "../_components/Pagination";
import Link from "next/link";
import { FiPlus, FiBookOpen, FiZap, FiArrowLeft } from "react-icons/fi";
import { BookRecommendation } from "../_types/book";

const PAGE_SIZE = 6;

const BooksPage = async ({ searchParams }: { searchParams: { query?: string; page?: string } }) => {
    const user = await getSession();
    if (!user) {
        redirect("/login");
    }

    const books = await getBooks(user.id.toString());
    const params = await searchParams;
    const selectedQuery = params.query;
    const currentPage = parseInt(params.page || "1", 10);

    // Aggregate unique queries
    const queryGroups = books.reduce((acc: any, book: BookRecommendation) => {
        if (!acc[book.query]) {
            acc[book.query] = { query: book.query, count: 0, lastDate: book.recommendationDate };
        }
        acc[book.query].count += 1;
        if (new Date(book.recommendationDate) > new Date(acc[book.query].lastDate)) {
            acc[book.query].lastDate = book.recommendationDate;
        }
        return acc;
    }, {});

    const queryList = Object.values(queryGroups).sort((a: any, b: any) =>
        new Date(b.lastDate).getTime() - new Date(a.lastDate).getTime()
    );

    // Pagination logic
    const totalPages = Math.ceil(queryList.length / PAGE_SIZE);
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const paginatedQueries = queryList.slice(startIndex, startIndex + PAGE_SIZE);

    const filteredBooks = selectedQuery
        ? books.filter(b => b.query === selectedQuery)
        : [];

    return (
        <div className="max-w-7xl mx-auto px-4 py-16">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-16 gap-8">
                <div className="flex items-center gap-6">
                    <div className="p-5 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] text-white shadow-2xl shadow-blue-200">
                        <FiBookOpen size={40} />
                    </div>
                    <div>
                        <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight">
                            {selectedQuery ? "Search Results" : "AI Book Library"}
                        </h1>
                        <p className="text-gray-500 text-lg mt-2 flex items-center gap-2">
                            <FiZap className="text-blue-500" />
                            {selectedQuery
                                ? `Showing ${filteredBooks.length} recommendations for "${selectedQuery}"`
                                : `Discover ${queryList.length} unique search sessions in your library`
                            }
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {selectedQuery && (
                        <Link
                            href="/books"
                            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-bold px-6 py-4 rounded-[1.5rem] bg-gray-50 border border-gray-100 transition-all hover:bg-gray-100"
                        >
                            <FiArrowLeft />
                            Back to Library
                        </Link>
                    )}
                    <Link
                        href="/books/new"
                        className="flex items-center gap-3 bg-gray-900 hover:bg-black text-white px-8 py-4 rounded-[1.5rem] font-bold shadow-xl transition-all active:scale-95 group"
                    >
                        <FiPlus className="group-hover:rotate-90 transition-transform" />
                        New Search Query
                    </Link>
                </div>
            </div>

            {!books || books.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-8 text-gray-300 shadow-sm">
                        <FiBookOpen size={48} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800">Your library is empty</h3>
                    <p className="text-gray-500 mt-3 mb-10 text-center max-w-md">
                        What are you curious about today? Use our AI to find your next great read.
                    </p>
                    <Link
                        href="/books/new"
                        className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                    >
                        Search for Books
                    </Link>
                </div>
            ) : selectedQuery ? (
                <BookGrid
                    books={filteredBooks}
                    backendUrl={process.env.NEXT_PUBLIC_BACKEND_EXTERNAL_URL}
                />
            ) : (
                <>
                    <QueryList queries={paginatedQueries as any} />
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        baseUrl="/books"
                    />
                </>
            )}
        </div>
    );
};

export default BooksPage;