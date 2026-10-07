# NC News Demo Workflow

This workflow is for local development and portfolio demonstrations. It does not create or publish shared production credentials.

## Reset demo data

From the backend repository run:

```bash
npm run demo:reset
```

This recreates the local development databases and loads the standard NC News seed dataset.

Use the development-only credentials defined by the seed setup when demonstrating authenticated features. Never copy a shared demo password into production.

## Suggested portfolio demo

1. Show the public feed, search, topics, sorting and pagination.
2. Sign in with a local seeded account.
3. Create a private draft, reopen it from Dashboard and publish it.
4. Open another user's article and demonstrate persistent voting.
5. Save the article and show it in Dashboard.
6. Follow the author and open the personalised Following feed.
7. Add a comment, reply to a comment and demonstrate comment voting and editing.
8. Show Notifications and mark an item read.
9. Open a public profile and show contribution stats and tabs.
10. Edit an owned article and show revision history.
11. Explain that ownership is enforced by the API rather than only hidden frontend controls.
12. Show health endpoints, CI and versioned migrations as production-quality engineering features.

## Production rule

Do not run destructive seed commands against production. Production schema changes use:

```bash
npm run migrate
```
