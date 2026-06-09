import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import FeedbackButton from './FeedbackButton';
import axios from 'axios';

jest.mock('axios');

describe('FeedbackButton Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders thumb up and thumb down buttons', () => {
        render(<FeedbackButton bookId={1} />);
        expect(screen.getByTitle('Helpful recommendation')).toBeInTheDocument();
        expect(screen.getByTitle('Not helpful')).toBeInTheDocument();
    });

    it('calls axios post when thumb up is clicked and sets positive state', async () => {
        (axios.post as jest.Mock).mockResolvedValueOnce({ data: { success: true } });
        
        render(<FeedbackButton bookId={1} query="test query" />);
        const upButton = screen.getByTitle('Helpful recommendation');
        
        fireEvent.click(upButton);
        
        expect(axios.post).toHaveBeenCalledWith(
            expect.stringContaining('/api/recommend/feedback/'),
            { book: 1, query: "test query", is_positive: true },
            { withCredentials: true }
        );

        // Optimistic update should make the button active
        expect(upButton).toHaveClass('text-green-600');
    });

    it('reverts state if axios request fails', async () => {
        (axios.post as jest.Mock).mockRejectedValueOnce(new Error('API Error'));
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        render(<FeedbackButton bookId={1} />);
        const downButton = screen.getByTitle('Not helpful');
        
        fireEvent.click(downButton);
        
        await waitFor(() => {
            expect(downButton).toHaveClass('text-gray-400'); // Reverted to default
        });

        consoleSpy.mockRestore();
    });
});
