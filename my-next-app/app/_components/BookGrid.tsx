import React from "react";
import { BookRecommendation } from "../_types/book";
import Link from "next/link";
import { FiBook, FiEye, FiUser, FiCalendar } from "react-icons/fi";
import DeleteButton from "./DeleteButton";
import { deleteBookAction } from "../actions/book";
import AddToCartButton from "./AddToCartButton";
import FeedbackButton from "./FeedbackButton";

export default function BookGrid({ books, backendUrl }: { books: BookRecommendation[], backendUrl?: string }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {books.map((book: BookRecommendation) => (
                <div
                    key={book.id}
                    className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                        <FiBook size={120} />
                    </div>

                    <div className="relative">
                        <div className="flex items-start gap-5 mb-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-100 group-hover:rotate-6 transition-transform">
                                <FiBook size={28} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-xl font-extrabold text-gray-900 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">
                                    {book.title}
                                </h3>
                                <div className="flex items-center gap-1.5 text-gray-400 text-sm mt-2 font-medium">
                                    <FiUser size={14} />
                                    <span>{book.author}</span>
                                </div>
                            </div>
                        </div>

                        <p className="text-gray-500 text-sm line-clamp-3 mb-8 leading-relaxed">
                            {book.description}
                        </p>

                        <div className="flex items-center justify-between mb-8 text-xs font-bold uppercase tracking-widest text-gray-400 bg-gray-50 p-3 rounded-xl border border-gray-100">
                            <div className="flex items-center gap-2">
                                <FiCalendar className="text-blue-500" />
                                <span>{new Date(book.recommendationDate).toLocaleDateString()}</span>
                            </div>

                            <div className="flex items-center gap-2">
                                {book.originalId && (
                                    <div className="mr-2">
                                        <FeedbackButton bookId={book.originalId} query={book.query} />
                                    </div>
                                )}
                                <span className="text-blue-600/50">#{book.query}</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-3">
                                <Link
                                    href={`/books/view/${book.id}`}
                                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gray-900 text-white font-bold hover:bg-black transition-all active:scale-95 shadow-lg shadow-gray-200"
                                >
                                    <FiEye size={18} />
                                    <span>Learn More</span>
                                </Link>
                                <DeleteButton
                                    action={deleteBookAction}
                                    id={book.id}
                                    confirmMessage={`Are you sure you want to remove the recommendation for "${book.title}"?`}
                                />
                            </div>

                            {book.productId && (
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <AddToCartButton
                                            productId={book.productId}
                                            productName={book.title}
                                        // price not available on BookRecommendation directly, assuming 0 for optimistic total update
                                        />
                                    </div>
                                    <a
                                        href={`${backendUrl || "http://localhost:8000"}/product/${book.productId}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center p-3 rounded-2xl bg-gray-50 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all border border-gray-100"
                                        title="View Details"
                                    >
                                        <FiEye size={20} />
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}