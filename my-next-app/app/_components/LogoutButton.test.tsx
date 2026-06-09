import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LogoutButton from './LogoutButton';
import { logoutAction } from '../actions/auth';
import { useRouter } from 'next/navigation';

// Mock the next navigation router
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));

// Mock the server action
jest.mock('../actions/auth', () => ({
    logoutAction: jest.fn(),
}));

describe('LogoutButton Component', () => {
    const mockPush = jest.fn();
    const mockRefresh = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (useRouter as jest.Mock).mockReturnValue({
            push: mockPush,
            refresh: mockRefresh,
        });
    });

    it('renders the logout button', () => {
        render(<LogoutButton />);
        expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
    });

    it('calls logoutAction and redirects on click', async () => {
        (logoutAction as jest.Mock).mockResolvedValueOnce(undefined);
        
        render(<LogoutButton />);
        const button = screen.getByRole('button', { name: /logout/i });
        
        fireEvent.click(button);
        
        expect(logoutAction).toHaveBeenCalled();
        
        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/login');
            expect(mockRefresh).toHaveBeenCalled();
        });
    });

    it('handles logoutAction errors gracefully', async () => {
        (logoutAction as jest.Mock).mockRejectedValueOnce(new Error('Logout failed'));
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

        render(<LogoutButton />);
        const button = screen.getByRole('button', { name: /logout/i });
        
        fireEvent.click(button);
        
        await waitFor(() => {
            expect(logoutAction).toHaveBeenCalled();
            expect(mockPush).not.toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalledWith('Logout failed :', expect.any(Error));
        });

        consoleSpy.mockRestore();
    });
});
