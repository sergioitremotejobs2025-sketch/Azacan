import React from "react";
import Link from "next/link";
import { FiSearch, FiChevronRight, FiDatabase, FiClock } from "react-icons/fi";

interface QueryGroup {
    query: string;
    count: number;
    lastDate: string;
}

export default function QueryList({ queries }: { queries: QueryGroup[] }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {queries.map((group) => (
                <Link
                    key={group.query}
                    href={`/books?query=${encodeURIComponent(group.query)}`}
                    className="group bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-sm">
                            <FiSearch size={24} />
                        </div>
                        <div className="flex items-center gap-2 text-gray-400 font-bold text-xs uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                            <FiDatabase />
                            <span>{group.count} Result{group.count !== 1 ? 's' : ''}</span>
                        </div>
                    </div>

                    <h3 className="text-2xl font-black text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight mb-4">
                        {group.query}
                    </h3>

                    <div className="flex items-center justify-between mt-auto pt-6 border-t border-gray-50">
                        <div className="flex items-center gap-2 text-gray-400 text-xs font-semibold">
                            <FiClock />
                            <span>{new Date(group.lastDate).toLocaleDateString()}</span>
                        </div>
                        <div className="text-blue-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                            <FiChevronRight size={20} />
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
}
