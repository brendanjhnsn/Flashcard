import { test, expect } from '@playwright/test'

// Use a unique email per test run so tests don't conflict
const email = `test-${Date.now()}@example.com`
const password = 'password123'

test.describe('Flashcard App', () => {
  test('register, create a card, edit it, then delete it', async ({ page }) => {
    // Register
    await page.goto('/register')
    await page.fill('input[type="email"]', email)
    await page.fill('input[type="password"]', password)
    await page.click('button[type="submit"]')

    // Should land on /cards
    await expect(page).toHaveURL('/cards')
    await expect(page.getByText('My Cards')).toBeVisible()

    // Create a card
    await page.click('button:has-text("+ New card")')
    await page.locator('fieldset:has(legend:text("Front")) textarea').fill('What is 2 + 2?')
    await page.locator('fieldset:has(legend:text("Back")) textarea').fill('4')
    await page.click('button[type="submit"]')

    // Card appears in list
    await expect(page.getByText('What is 2 + 2?')).toBeVisible()

    // Edit the card
    await page.click('button:has-text("Edit")')
    await page.locator('fieldset:has(legend:text("Front")) textarea').fill('What is 3 + 3?')
    await page.click('button[type="submit"]')
    await expect(page.getByText('What is 3 + 3?')).toBeVisible()

    // Delete the card
    page.on('dialog', (dialog) => dialog.accept())
    await page.click('button:has-text("Delete")')
    await expect(page.getByText('What is 3 + 3?')).not.toBeVisible()
    await expect(page.getByText('No cards yet')).toBeVisible()
  })

  test('login with existing account', async ({ page }) => {
    // Register first
    await page.goto('/register')
    await page.fill('input[type="email"]', email)
    await page.fill('input[type="password"]', password)
    await page.click('button[type="submit"]')
    await page.click('button:has-text("Log out")')

    // Now log in
    await page.goto('/login')
    await page.fill('input[type="email"]', email)
    await page.fill('input[type="password"]', password)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/cards')
  })

  test('shows error for wrong password on login', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'nobody@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    await expect(page.getByRole('alert')).toContainText('Invalid email or password')
  })

  test('redirects unauthenticated users to /login', async ({ page }) => {
    await page.goto('/cards')
    await expect(page).toHaveURL('/login')
  })
})
