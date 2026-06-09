import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import CartIndicator from './CartIndicator';
import { useCart } from '../_hooks/useCart';

jest.mock('../_hooks/useCart', () => ({
    useCart: jest.fn(),
}));

describe('CartIndicator Component', () => {
    it('renders cart icon without badge when count is 0', () => {
        (useCart as jest.Mock).mockReturnValue({ cart: { count: 0 }, isLoading: false });
        render(<CartIndicator />);
        expect(screen.getByTitle('View Cart')).toBeInTheDocument();
        expect(screen.queryByText('0')).not.toBeInTheDocument();
    });

    it('renders cart icon with correct count badge', () => {
        (useCart as jest.Mock).mockReturnValue({ cart: { count: 5 }, isLoading: false });
        render(<CartIndicator />);
        expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('renders 99+ when cart count is over 99', () => {
        (useCart as jest.Mock).mockReturnValue({ cart: { count: 105 }, isLoading: false });
        render(<CartIndicator />);
        expect(screen.getByText('99+')).toBeInTheDocument();
    });
});
