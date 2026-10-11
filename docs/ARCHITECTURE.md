# NC News Architecture

## Overview

```text
React / Vite client
        |
        | HTTPS + bearer token
        v
Express API on Render
        |
        | parameterised SQL
        v
PostgreSQL
```

The frontend and backend deploy independently. Guests use public read endpoints; authenticated writes are protected by a signed token and server-side ownership checks.

## Backend layers

- **Routes** define the HTTP contract.
- **Controllers** validate/translate HTTP input and output.
- **Models** own SQL, transactions and data-integrity rules.
- **Middleware** handles authentication, moderator access, rate limiting and request logging.
- **Migrations** evolve production schema without destructive reseeding.
- **Tests** exercise the HTTP contract against PostgreSQL.

## Core data model

```text
users
  |--< articles
  |--< comments
  |--< article_votes >-- articles
  |--< article_reactions >-- articles
  |--< comment_votes >-- comments
  |--< saved_articles >-- articles
  |--< user_follows >-- users
  |--< topic_follows >-- topics
  |--< collections
  |      |--< collection_articles >-- articles
  |--< notifications
  |--< reports
  |--< moderator_audit_log

articles
  |--< comments
  |      |--< comments (parent_comment_id)
  |--< article_revisions
```

Users can also reference one `pinned_article_id` as a featured public story.

## Authentication and ownership

Passwords use scrypt-derived hashes. Tokens identify the user through the token subject.

Protected mutations derive identity from `req.user.username`. Article ownership, comment ownership, collection ownership, draft privacy and account operations are enforced in the API. Hiding a frontend control is never treated as authorisation.

## Publishing lifecycle

Articles can be:

- private drafts
- published
- revised
- soft-deleted

Edits create revision history. Soft deletion hides an article publicly without destroying related moderation/history data.

Comments support nested replies. Soft-deleted comments become tombstones so descendants are not orphaned.

## Discovery

NC News deliberately keeps discovery inside PostgreSQL:

- text search using `ILIKE`
- topic/author/date filters
- Hot ranking using votes, discussion and recency
- trending topic ranking
- recommendation scoring using topic, author and engagement
- personalised feeds using user follows + topic follows

No recommendation/search SaaS is required.

## Social state

Persistent join tables model:

- article votes
- article reactions
- comment votes
- bookmarks
- named collections
- user follows
- topic follows

This prevents refresh-based duplicate actions and keeps user state consistent across devices.

## Notifications

Notifications are stored in PostgreSQL and currently cover:

- follows
- article comments
- replies
- article vote events
- @mentions

The UI reads unread counts and can mark individual/all notifications as read.

## Moderation

Users can report public articles/comments. Moderators can:

- review the report queue
- resolve/dismiss reports
- view platform analytics
- view an immutable moderation action trail

Review decisions write to `moderator_audit_log`.

## Reliability and operations

- `/healthz`: process health
- `/readyz`: PostgreSQL readiness
- `X-Request-Id`: request correlation
- structured request logs
- rate limiting
- consistent JSON error handling
- versioned `schema_migrations`
- migration idempotency checked in CI

## CI

```text
GitHub push
   |
   +--> PostgreSQL service
   +--> npm ci
   +--> setup + seed
   +--> migrate
   +--> migrate again
   +--> Jest/Supertest
```

## Deployment

```text
Frontend: GitHub main -> Netlify -> React/Vite
Backend:  GitHub main -> Render -> migrate -> Express -> PostgreSQL
```

Production requires `DATABASE_URL` and `JWT_SECRET`.
