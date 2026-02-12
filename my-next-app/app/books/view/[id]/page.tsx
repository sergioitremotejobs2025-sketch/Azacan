import React from "react";
import { getBookById } from "@/app/api/book";
import { getSession } from "@/app/_lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FiArrowLeft, FiBook, FiUser, FiCalendar, FiShield, FiType, FiStar } from "react-icons/fi";

const ViewBookPage = async ({ params }: { params: { id: string } }) => {
    const user = await getSession();
    if (!user) {
        redirect("/login");
    }

    const { id } = await params;
    const book = await getBookById(id);

    if (!book) {
        return (
            <div className="max-w-2xl mx-auto p-12 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-50 text-red-500 mb-6">
                    <FiShield size={40} />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Recommendation Not Found</h1>
                <p className="text-gray-500 mb-8">This recommendation may have been removed or never existed.</p>
                <Link
                    href="/books"
                    className="inline-flex items-center gap-2 text-blue-600 font-bold hover:underline underline-offset-4"
                >
                    <FiArrowLeft /> Back to Library
                </Link>
            </div>
        );
    }

    // Verify ownership
    if (book.userId !== user.id.toString()) {
        redirect("/books");
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-12">
            <Link
                href="/books"
                className="flex-1 flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-8 font-medium group"
            >
                <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" />
                Back to Library
            </Link>

            <div className="bg-white rounded-[3rem] shadow-2xl shadow-blue-900/5 overflow-hidden border border-gray-100 flex flex-col lg:flex-row">
                {/* Book Cover Visual */}
                <div className="lg:w-1/3 bg-gradient-to-br from-blue-600 to-indigo-800 p-12 flex items-center justify-center min-h-[400px]">
                    <div className="w-full aspect-[2/3] bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl flex flex-col items-center justify-center text-white text-center p-8">
                        <FiBook size={80} className="mb-6 opacity-50" />
                        <h2 className="text-2xl font-bold mb-2 leading-tight">{book.title}</h2>
                        <p className="text-sm font-medium text-white/60">{book.author}</p>
                    </div>
                </div>

                {/* Content */}
                <div className="lg:w-2/3 p-12 lg:p-16">
                    <div className="flex items-center gap-2 mb-6">
                        <span className="px-4 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-extrabold uppercase tracking-widest">
                            AI Choice
                        </span>
                        <div className="flex text-yellow-400">
                            <FiStar size={16} fill="currentColor" />
                            <FiStar size={16} fill="currentColor" />
                            <FiStar size={16} fill="currentColor" />
                            <FiStar size={16} fill="currentColor" />
                            <FiStar size={16} fill="currentColor" />
                        </div>
                    </div>

                    <h1 className="text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
                        {book.title}
                    </h1>

                    <div className="flex items-center gap-8 mb-12">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                                <FiUser size={18} />
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Author</p>
                                <p className="text-gray-900 font-bold">{book.author}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                                <FiType size={18} />
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Search Context</p>
                                <p className="text-gray-900 font-bold">"{book.query}"</p>
                            </div>
                        </div>
                    </div>

                    <div className="prose prose-blue max-w-none">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Expert Review</h3>
                        <p className="text-gray-500 text-lg leading-relaxed mb-8">
                            {book.description}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-12 border-t border-gray-100">
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50">
                            <FiCalendar size={20} className="text-blue-500" />
                            <div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Generated On</p>
                                <p className="text-gray-900 font-bold">{new Date(book.recommendationDate).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50">
                            <FiShield size={20} className="text-blue-500" />
                            <div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Record ID</p>
                                <p className="text-gray-900 font-bold">#{book.id.slice(0, 8)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewBookPage;