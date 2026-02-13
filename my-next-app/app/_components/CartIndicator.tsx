'use client';

import React from 'react';
import { useCart } from '../_hooks/useCart';
import { FiShoppingCart } from 'react-icons/fi';
import Link from 'next/link';

export default function CartIndicator() {
    const { cart, isLoading } = useCart();

    // Use optimistic count if available
    const count = cart?.count || 0;

    return (
        <Link
            href={process.env.NEXT_PUBLIC_BACKEND_API_URL ? `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/cart` : 'http://localhost:8000/cart'}
            className="relative flex items-center justify-center w-10 h-10 rounded-full bg-gray-50 text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
            title="View Cart"
        >
            <FiShoppingCart size={20} />
            {count > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white animate-in zoom-in duration-300">
                    {count > 99 ? '99+' : count}
                </span>
            )}
        </Link>
    );
}
