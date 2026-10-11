# NC News Demo Workflow

Use this flow for portfolio/interview demonstrations.

## Local reset

```bash
npm run demo:reset
```

This is development-only. Never run destructive seeding against production.

## Suggested demo

1. Open Home and show Hot stories + trending topics.
2. Open Articles and demonstrate search, date filtering, sorting and pagination.
3. Sign in with a local seeded account.
4. Follow a writer and a topic, then open the personalised Following feed.
5. Create a private draft, close/reopen the editor, show local autosave recovery, preview it and publish it.
6. Open another user's story and demonstrate:
   - Agree/Disagree switching
   - Insightful/Useful/Funny reactions
   - bookmarking
   - adding to a named Collection
   - reading progress
   - "More like this" recommendations
7. Add a comment, reply in a thread, mention another user with `@username`, vote on a comment and collapse/expand replies.
8. Open Notifications and show the mention/reply/follow state.
9. Open a public profile and show stats, bio, contribution tabs and featured story.
10. Edit one of your articles and show revision history.
11. Show Dashboard activity, Saved articles, drafts, followed writers and collections.
12. Report an article/comment.
13. Sign in as a moderator and show:
    - report queue
    - analytics
    - audit history
14. Show `/healthz`, `/readyz`, rate limiting, request IDs and CI.
15. Explain that identity/ownership are enforced by the API, not by hidden React buttons.

## Engineering talking points

Useful interview topics:

- transactional per-user voting
- idempotent migrations
- soft deletion and thread preservation
- server-side ownership checks
- relational modelling for collections/follows/reactions
- PostgreSQL-based recommendation/trending logic
- request tracing and readiness checks
- browser E2E, accessibility and performance gates on the frontend
