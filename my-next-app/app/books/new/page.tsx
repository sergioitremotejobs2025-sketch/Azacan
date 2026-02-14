import React from "react";
import BookQueryForm from "../../_components/BookQueryForm";
import { FiZap, FiArrowLeft } from "react-icons/fi";
import Link from "next/link";

import { getSession } from "../../_lib/session";
import { redirect } from "next/navigation";

const NewBookSearch = async () => {
    const user = await getSession();
    if (!user) {
        redirect("/login");
    }

    return (
        <div className="max-w-3xl mx-auto px-4 py-20">
            <Link
                href="/books"
                className="flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-colors mb-12 font-medium"
            >
                Back to Library
            </Link>

            <div className="text-center mb-16">
                <div className="inline-flex items-center justify-center p-4 bg-blue-50 text-blue-600 rounded-3xl mb-6 shadow-sm">
                    {/* Icon removed for debugging */}
                </div>
                <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight mb-4">Discover Your Next Read</h1>
                <p className="text-gray-500 text-lg max-w-lg mx-auto leading-relaxed">
                    Powered by AI. Mention a topic, an author, or a feeling, and we'll find 5 perfect books for you.
                </p>
            </div>

            <div className="bg-white p-10 rounded-[3rem] shadow-2xl shadow-blue-900/5 border border-gray-100">
                <BookQueryForm />
            </div>

            <div className="mt-12 text-center text-gray-400 text-sm font-medium">
                Try: "Hard science fiction about Mars" or "Personal finance for beginners"
            </div>
        </div>
    );
};

export default NewBookSearch;