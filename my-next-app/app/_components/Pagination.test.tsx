import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Pagination from './Pagination';

describe('Pagination Component', () => {
    it('does not render if totalPages <= 1', () => {
        const { container } = render(<Pagination currentPage={1} totalPages={1} baseUrl="/books" />);
        expect(container.firstChild).toBeNull();
    });

    it('renders the correct number of pages', () => {
        render(<Pagination currentPage={2} totalPages={3} baseUrl="/books" />);
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('disables previous button on the first page', () => {
        render(<Pagination currentPage={1} totalPages={3} baseUrl="/books" />);
        const links = screen.getAllByRole('link');
        const prevLink = links[0];
        expect(prevLink).toHaveAttribute('aria-disabled', 'true');
    });

    it('disables next button on the last page', () => {
        render(<Pagination currentPage={3} totalPages={3} baseUrl="/books" />);
        const links = screen.getAllByRole('link');
        const nextLink = links[links.length - 1];
        expect(nextLink).toHaveAttribute('aria-disabled', 'true');
    });
});
