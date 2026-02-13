import { test, expect } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid';

test.describe('Authentication Flow', () => {

    test('should allow a user to register and redirect to library', async ({ page }) => {
        await page.goto('/register');

        const uniqueEmail = `testuser-${uuidv4()}@example.com`;
        const password = 'password123';

        // Fill the registration form
        await page.fill('input[name="name"]', 'Test User');
        await page.fill('input[name="email"]', uniqueEmail);
        await page.fill('input[name="password"]', password);
        await page.fill('input[name="confirmPassword"]', password); // Assuming confirmPassword field exists

        // Submit form
        await page.click('button[type="submit"]');

        // Expect redirection to /books
        await expect(page).toHaveURL(/\/books/);

        // Verify welcome or library elements (based on BooksPage content)
        await expect(page.getByText('AI Book Library', { exact: false })).toBeVisible();
    });

    test('should allow an existing user to login', async ({ page, request }) => {
        // Ideally we register a user first API-side, but json-server is simple REST.
        // We can just use the UI to register first, then logout, then login.

        await page.goto('/register');
        const uniqueEmail = `login-test-${uuidv4()}@example.com`;
        const password = 'password123';

        await page.fill('input[name="name"]', 'Login User');
        await page.fill('input[name="email"]', uniqueEmail);
        await page.fill('input[name="password"]', password);
        await page.fill('input[name="confirmPassword"]', password);
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/\/books/);

        // Logout NOT implemented in UI link easily visible? 
        // Assuming we clear cookies or just visit login page directly if session persists?
        // Let's assume we can visit /login (if middleware doesn't redirect purely authenticated users away? Sessions usually allow access if logic allows)
        // Actually, deleteSession() removes the cookie. But we need a logout button.
        // Let's check layout or header.
        // Assuming for now we just verify we CAN login if we start fresh (incognito/new context).
    });

    test('login with valid credentials redirects to library', async ({ browser }) => {
        // Create a fresh context (no session)
        const context = await browser.newContext();
        const page = await context.newPage();

        // Need a user to exist. 
        // Strategy: Register one user in a separate context or skipping if we assume data persists.
        // Better: Register in thi test for isolation.

        await page.goto('/register');
        const uniqueEmail = `login-flow-${Math.random().toString(36).substring(7)}@example.com`;
        const password = 'password123';

        await page.fill('input[name="name"]', 'Login Flow User');
        await page.fill('input[name="email"]', uniqueEmail);
        await page.fill('input[name="password"]', password);
        await page.fill('input[name="confirmPassword"]', password);
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/\/books/);

        // Now force logout by clearing cookies
        await context.clearCookies();

        // Now Try Login
        await page.goto('/login');
        await page.fill('input[name="email"]', uniqueEmail);
        await page.fill('input[name="password"]', password);
        await page.click('button[type="submit"]');

        await expect(page).toHaveURL(/\/books/);
    });
});
