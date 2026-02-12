import React from "react";
import Link from "next/link";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    baseUrl: string;
}

export default function Pagination({ currentPage, totalPages, baseUrl }: PaginationProps) {
    if (totalPages <= 1) return null;

    const getPageUrl = (page: number) => {
        const url = new URL(baseUrl, "http://localhost:3000");
        url.searchParams.set("page", page.toString());
        return url.pathname + url.search;
    };

    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    return (
        <div className="flex items-center justify-center gap-3 mt-16">
            <Link
                href={currentPage > 1 ? getPageUrl(currentPage - 1) : "#"}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${currentPage > 1
                        ? "bg-white text-gray-900 border border-gray-100 hover:bg-gray-50 hover:shadow-lg shadow-sm"
                        : "bg-gray-50 text-gray-300 cursor-not-allowed border border-gray-100"
                    }`}
                aria-disabled={currentPage <= 1}
            >
                <FiChevronLeft size={20} />
            </Link>

            <div className="flex items-center gap-2">
                {pages.map((p) => (
                    <Link
                        key={p}
                        href={getPageUrl(p)}
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold transition-all ${currentPage === p
                                ? "bg-blue-600 text-white shadow-xl shadow-blue-200"
                                : "bg-white text-gray-600 border border-gray-100 hover:border-blue-200 hover:text-blue-600 shadow-sm"
                            }`}
                    >
                        {p}
                    </Link>
                ))}
            </div>

            <Link
                href={currentPage < totalPages ? getPageUrl(currentPage + 1) : "#"}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${currentPage < totalPages
                        ? "bg-white text-gray-900 border border-gray-100 hover:bg-gray-50 hover:shadow-lg shadow-sm"
                        : "bg-gray-50 text-gray-300 cursor-not-allowed border border-gray-100"
                    }`}
                aria-disabled={currentPage >= totalPages}
            >
                <FiChevronRight size={20} />
            </Link>
        </div>
    );
}
