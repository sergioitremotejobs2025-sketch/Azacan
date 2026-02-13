'use client';

import React, { useState } from 'react';
import { FiThumbsUp, FiThumbsDown } from 'react-icons/fi';
import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface FeedbackButtonProps {
    bookId: number;
    query?: string;
}

export default function FeedbackButton({ bookId, query }: FeedbackButtonProps) {
    const [status, setStatus] = useState<'none' | 'positive' | 'negative'>('none');
    const [isPending, setIsPending] = useState(false);

    const handleFeedback = async (isPositive: boolean) => {
        if (isPending) return;

        const newStatus = isPositive ? 'positive' : 'negative';

        // Toggle off if clicking same button? Optional, but typical behavior.
        // For simplicity, just set.
        if (status === newStatus) return;

        // Optimistic update
        setStatus(newStatus);
        setIsPending(true);

        try {
            await axios.post(`${API_BASE}/api/recommend/feedback/`, {
                book: bookId,
                query: query || "",
                is_positive: isPositive
            }, {
                withCredentials: true
            });
        } catch (error) {
            console.error('Feedback failed:', error);
            setStatus('none'); // Revert on error
        } finally {
            setIsPending(false);
        }
    };

    return (
        <div className="flex items-center gap-1 bg-white rounded-full border border-gray-100 shadow-sm p-1">
            <button
                onClick={() => handleFeedback(true)}
                disabled={isPending}
                className={`p-2 rounded-full transition-all active:scale-90 ${status === 'positive'
                    ? 'text-green-600 bg-green-50 shadow-inner'
                    : 'text-gray-400 hover:text-green-600 hover:bg-gray-50'}`}
                title="Helpful recommendation"
            >
                <FiThumbsUp size={16} fill={status === 'positive' ? 'currentColor' : 'none'} />
            </button>
            <div className="w-px h-4 bg-gray-200 mx-1"></div>
            <button
                onClick={() => handleFeedback(false)}
                disabled={isPending}
                className={`p-2 rounded-full transition-all active:scale-90 ${status === 'negative'
                    ? 'text-red-500 bg-red-50 shadow-inner'
                    : 'text-gray-400 hover:text-red-500 hover:bg-gray-50'}`}
                title="Not helpful"
            >
                <FiThumbsDown size={16} fill={status === 'negative' ? 'currentColor' : 'none'} />
            </button>
        </div>
    );
}
