# NC News Architecture

## Overview

NC News is a React client backed by a Node.js and Express REST API with PostgreSQL.

```text
Browser / React
      |
      | HTTPS + bearer token
      v
Express API on Render
      |
      | parameterised SQL
      v
PostgreSQL
```

The frontend is deployed separately on Netlify. Public reads do not require authentication. Protected writes use a signed bearer token issued by the API.

## Backend layers

- Routes map HTTP methods and paths.
- Controllers translate HTTP input and output.
- Models contain database queries and transactional rules.
- Middleware handles authentication, rate limiting and request logging.
- Migrations evolve production schema without destructive reseeding.
- Tests exercise the HTTP contract against PostgreSQL.

## Main data relationships

```text
users
  |--< articles
  |--< comments
  |--< saved_articles >-- articles
  |--< article_votes >-- articles
  |--< comment_votes >-- comments
  |--< user_follows >-- users
  |--< notifications
  |--< reports

articles
  |--< comments
  |--< article_revisions

comments
  |--< comments (parent_comment_id)
```

## Authentication and ownership

Passwords are stored using scrypt-derived hashes. Tokens identify the user through the token subject; write endpoints do not trust a username supplied by the browser.

Ownership rules are enforced in the API for articles, comments, drafts, revisions and account operations. Frontend button visibility is only UX and is not treated as authorization.

## Product flows

Publishing supports private drafts, publication, editing, revision history and owner deletion. Discussion supports threaded replies, comment editing and per-user voting. Social features include follows, a following feed, bookmarks, activity, notifications and public profile contribution stats.

## Reliability and operations

- `/healthz` reports process health.
- `/readyz` verifies PostgreSQL connectivity.
- Requests receive an `X-Request-Id` and structured JSON request logs.
- Authentication endpoints and write operations are rate limited.
- Production schema changes are tracked in `schema_migrations`.
- GitHub Actions seeds PostgreSQL, executes migrations twice to verify idempotency, then runs Jest and Supertest.

## Deployment

```text
Frontend: GitHub main -> Netlify -> React/Vite
Backend:  GitHub main -> Render -> migrate -> Express -> PostgreSQL
```

Production requires `DATABASE_URL` and `JWT_SECRET`.
