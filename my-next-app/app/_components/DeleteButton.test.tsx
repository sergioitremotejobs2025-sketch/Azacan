import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import DeleteButton from './DeleteButton';

// Mock useActionState to bypass React Server Actions context
jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useActionState: (action: any, initialState: any) => [initialState, action],
}));

describe('DeleteButton Component', () => {
    const mockAction = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        window.confirm = jest.fn(() => true); // Mock confirm to always accept
    });

    it('renders the delete button', () => {
        render(<DeleteButton action={mockAction} id="123" />);
        expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('calls confirm dialog on click', () => {
        render(<DeleteButton action={mockAction} id="123" confirmMessage="Delete this?" />);
        const button = screen.getByRole('button');
        
        fireEvent.click(button);
        
        expect(window.confirm).toHaveBeenCalledWith("Delete this?");
    });

    it('prevents default if confirm is rejected', () => {
        window.confirm = jest.fn(() => false);
        render(<DeleteButton action={mockAction} id="123" />);
        const button = screen.getByRole('button');
        
        const event = new MouseEvent('click', { bubbles: true, cancelable: true });
        Object.defineProperty(event, 'preventDefault', { value: jest.fn() });
        
        fireEvent(button, event);
        
        expect(event.preventDefault).toHaveBeenCalled();
    });
});
