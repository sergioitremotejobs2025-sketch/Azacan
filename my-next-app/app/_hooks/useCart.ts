import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

// Ensure consistent API URL
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Interface for Cart Item
export interface CartItem {
    id: number;
    name: string;
    price: number;
    sale_price?: number;
    is_sale: boolean;
    image?: string;
    quantity: number;
    total_price: number;
}

export interface CartData {
    products: CartItem[];
    total: number;
    count: number;
}

// Fetch Cart Function
const fetchCart = async (): Promise<CartData> => {
    const { data } = await axios.get(`${API_BASE}/api/cart/`, { withCredentials: true });
    return data;
};

export const useCart = () => {
    const queryClient = useQueryClient();

    // Query: Get Cart
    const { data: cart, isLoading, isError } = useQuery({
        queryKey: ['cart'],
        queryFn: fetchCart,
    });

    // Mutation: Add to Cart (Optimistic Update)
    const addToCartMutation = useMutation({
        mutationFn: async ({ productId, quantity }: { productId: number; quantity: number }) => {
            await axios.post(`${API_BASE}/api/cart/`, {
                product_id: productId,
                quantity,
            }, { withCredentials: true });
        },
        // Optimistic Update Logic
        onMutate: async ({ productId, quantity }) => {
            // Cancel persistent outgoing refetches so they don't overwrite optimistic update
            await queryClient.cancelQueries({ queryKey: ['cart'] });

            // Snapshot the previous value
            const previousCart = queryClient.getQueryData<CartData>(['cart']);

            // Optimistically update to the new value
            if (previousCart) {
                // Simple logic: increment count, add fake item if not exists
                // Since we don't have full product details here (only ID), 
                // a perfect optimistic update is hard without extra data passed in.
                // We will just increment count as a minimal optimistic feedback.
                queryClient.setQueryData<CartData>(['cart'], {
                    ...previousCart,
                    count: previousCart.count + quantity,
                    // We can't easily update products list without full product data
                    // But user sees "Cart (X)" update instantly.
                });
            }

            return { previousCart };
        },
        // If the mutation fails, use the context returned from onMutate to roll back
        onError: (err, newTodo, context) => {
            if (context?.previousCart) {
                queryClient.setQueryData(['cart'], context.previousCart);
            }
        },
        // Always refetch after error or success:
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
        },
    });

    return {
        cart,
        isLoading,
        isError,
        addToCart: addToCartMutation.mutate,
        isAdding: addToCartMutation.isPending,
    };
};
