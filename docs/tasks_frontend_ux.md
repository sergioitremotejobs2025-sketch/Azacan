# Frontend & UX Tasks

Based on `PROJECT_IMPROVEMENTS.md`, here is the list of pending tasks for Frontend & User Experience:

- [x] **End-to-End (E2E) Testing**
  - [x] Add **Playwright** or **Cypress** tests to verify critical user flows.
  - *Goal:* Verify "Search for a book -> Add to Cart -> Checkout" automatically in the CI/CD pipeline.
  - *Implementation:* Added Playwright setup, config, and basic tests in `my-next-app/e2e/` (Auth, Search, Home). Added `test:e2e` script to `package.json`.

- [x] **Optimistic UI Updates**
  - [x] Implement optimistic updates in React Query/SWR for the "Add to Cart" action.
    - *Implementation:* Added `QueryProvider`, `useCart` hook (react-query), `AddToCartButton.tsx` (optimistic mutation), `CartIndicator.tsx` (live count), and integrated into `BookGrid` and `NavBar`.
  - *Goal:* Make the interface feel instantly responsive.

- [x] **Feedback Loop Integration**
  - [x] Add a "Thumbs Up/Down" mechanism for AI recommendations.
  - *Goal:* Log feedback to evaluate model performance and potentially fine-tune future models.
  - *Implementation:* Created `RecommendationFeedback` model and API endpoint in backend. Created `FeedbackButton.tsx` component and mapped backend `originalId` in frontend to enable submission. Integrated into `BookGrid`.
