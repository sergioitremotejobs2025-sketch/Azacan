import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AddToCartButton from './AddToCartButton';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import axios from 'axios';

jest.mock('axios');

const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('AddToCartButton Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders the add to cart button', () => {
        render(<AddToCartButton productId={123} />, { wrapper });
        expect(screen.getByText('Add to Cart')).toBeInTheDocument();
    });

    it('calls axios post on click and shows success state', async () => {
        (axios.post as jest.Mock).mockResolvedValueOnce({ data: { success: true } });
        
        render(<AddToCartButton productId={123} />, { wrapper });
        const button = screen.getByRole('button');
        
        fireEvent.click(button);
        
        expect(axios.post).toHaveBeenCalledWith(
            expect.stringContaining('/api/cart/'),
            { product_id: 123, quantity: 1 },
            { withCredentials: true }
        );

        await waitFor(() => {
            expect(screen.getByText('Added')).toBeInTheDocument();
        });
    });
});
