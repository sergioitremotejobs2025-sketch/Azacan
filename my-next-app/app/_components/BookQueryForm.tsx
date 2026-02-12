"use client";
import React, { useState } from "react";
import { saveRecommendationsAction } from "../actions/book";
import { FiSearch, FiBookOpen, FiCpu, FiCheckCircle } from "react-icons/fi";
import { useRouter } from "next/navigation";

const BookQueryForm = () => {
    const [query, setQuery] = useState("");
    const [isPending, setIsPending] = useState(false);
    const [streamedText, setStreamedText] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsPending(true);
        setStreamedText("");
        setError("");
        setSuccess("");

        try {
            const response = await fetch("/api/stream-recommendations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query }),
            });

            if (!response.ok) throw new Error("Failed to start streaming");

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) throw new Error("No reader available");

            let fullResult = "";
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                fullResult += chunk;
                setStreamedText(fullResult);
            }

            // After streaming, save the recommendations to the database
            const saveResult = await saveRecommendationsAction(query, fullResult);
            if (saveResult.error) {
                setError(saveResult.error);
            } else {
                setSuccess(saveResult.success || "Recommendations saved!");
                setQuery(""); // Clear input on success
                setStreamedText(""); // Clear stream preview
            }
        } catch (err: any) {
            setError(err.message || "Error generating recommendations");
        } finally {
            setIsPending(false);
            router.refresh();
        }
    };

    return (
        <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                        <FiSearch size={22} />
                    </div>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        required
                        className="w-full pl-14 pr-6 py-5 bg-white border-2 border-gray-100 rounded-[2rem] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-lg shadow-sm hover:border-gray-200"
                        placeholder="What are you interested in reading about?"
                    />
                </div>

                <div className="flex flex-col gap-4">
                    {error && (
                        <div className="p-4 rounded-2xl bg-red-50 text-red-600 text-sm font-semibold flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="p-4 rounded-2xl bg-green-50 text-green-600 text-sm font-semibold flex items-center gap-2">
                            <FiCheckCircle className="text-green-500" />
                            {success}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold py-5 px-8 rounded-[2rem] hover:shadow-2xl hover:shadow-blue-500/20 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-70 disabled:grayscale"
                    >
                        {isPending ? (
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>AI is generating...</span>
                            </div>
                        ) : (
                            <>
                                <FiBookOpen size={20} />
                                <span>Get AI Recommendations</span>
                            </>
                        )}
                    </button>
                </div>
            </form>

            {streamedText && (
                <div className="mt-8 p-6 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl border border-white/10 shadow-2xl animate-in fade-in zoom-in duration-500">
                    <div className="flex items-center gap-3 mb-4 text-blue-400">
                        <FiCpu className="animate-pulse" />
                        <span className="text-xs font-bold uppercase tracking-wider">Live AI Stream</span>
                    </div>
                    <div className="text-slate-300 font-mono text-sm leading-relaxed whitespace-pre-wrap transition-all">
                        {streamedText}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookQueryForm;