'use client';

import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FiShoppingCart, FiCheck } from 'react-icons/fi';
import axios from 'axios';

interface AddToCartProps {
    productId: number | string;
    productName?: string; // Optional for optimistic toast/feedback
    price?: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function AddToCartButton({ productId, productName, price }: AddToCartProps) {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async () => {
            await axios.post(`${API_BASE}/api/cart/`, {
                product_id: productId,
                quantity: 1,
            }, { withCredentials: true });
        },
        onMutate: async () => {
            // Optimistic Update: Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: ['cart'] });

            // Snapshot previous value
            const previousCart = queryClient.getQueryData<any>(['cart']);

            // Optimistically update count
            if (previousCart) {
                queryClient.setQueryData(['cart'], {
                    ...previousCart,
                    count: (previousCart.count || 0) + 1,
                    total: (previousCart.total || 0) + (price || 0),
                    // We can't easily add to 'products' list without full details, 
                    // but updating 'count' gives immediate navbar feedback.
                });
            }

            return { previousCart };
        },
        onError: (err, newTodo, context) => {
            if (context?.previousCart) {
                queryClient.setQueryData(['cart'], context.previousCart);
            }
            console.error("Failed to add to cart:", err);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
        },
    });

    return (
        <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className={`
        flex items-center justify-center gap-2 py-3 px-6 rounded-2xl font-bold transition-all active:scale-95 shadow-lg
        ${mutation.isSuccess
                    ? 'bg-green-500 text-white shadow-green-200'
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'
                }
        disabled:opacity-70 disabled:cursor-not-allowed
      `}
        >
            {mutation.isPending ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : mutation.isSuccess ? (
                <>
                    <FiCheck size={18} />
                    <span>Added</span>
                </>
            ) : (
                <>
                    <FiShoppingCart size={18} />
                    <span>Add to Cart</span>
                </>
            )}
        </button>
    );
}
