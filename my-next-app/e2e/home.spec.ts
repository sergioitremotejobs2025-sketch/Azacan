import { test, expect } from '@playwright/test';

test('homepage has title and links', async ({ page }) => {
    await page.goto('/');

    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/LibroMind/);

    // Check for main heading
    await expect(page.getByText('Read what')).toBeVisible();
    await expect(page.getByText('matters next.')).toBeVisible();

    // Check for "Go to My Library" link
    const libraryLink = page.getByRole('link', { name: 'Go to My Library' });
    await expect(libraryLink).toBeVisible();
    await expect(libraryLink).toHaveAttribute('href', '/books');

    // Check for "Ask AI Now" link
    const askAiLink = page.getByRole('link', { name: 'Ask AI Now' });
    await expect(askAiLink).toBeVisible();
    await expect(askAiLink).toHaveAttribute('href', '/books/new');
});
