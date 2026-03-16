# Playwright Tests – Internxt Meet

This folder contains end-to-end (E2E) tests for **Internxt Meet** using **Playwright**.


---
# Prerequisites

Make sure you have installed:

- Node.js
- Yarn
---
# Install dependencies

Install project dependencies:

`yarn install`

---
# Install Playwright browsers:

`npx playwright install`

# Environment configuration

Tests require environment variables.

Create a local environment file from the example template:

`cp .env.playwright.example .env.playwright`

Then update the values in **.env.playwright** with valid credentials.


# Running tests

Run all tests:

`npx playwright test`

Run a specific test file:

`npx playwright test playwright/tests/specific_test.spec.ts`

Run tests in UI mode:

`npx playwright test --ui`

# Debugging tests

Run tests with Playwright debugger:

`npx playwright test --debug`

# Test reports

After running tests, open the Playwright report:

`npx playwright show-report`

# Project structure
playwright/
 ├── helpers/       # reusable helper functions
 ├── pages/         # page objects
 ├── tests/         # test specifications
 └── readme.md      # documentation for Playwright tests

# Notes

Environment variables are loaded from **.env.playwright.**

**.env.playwright.example** provides a template for required variables.

**.env.playwright** should not be committed to the repository.