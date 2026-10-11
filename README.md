# NC News - Backend API

NC News is a full-stack community news platform backed by **Node.js**, **Express** and **PostgreSQL**. It began as a Northcoders API project and has since been extended into a portfolio-grade social publishing backend with authentication, ownership, discovery, moderation and production hardening.

## Links

- **Live API:** https://nc-news-vvdv.onrender.com/api
- **Frontend:** https://nc-news-sultan.netlify.app/
- **Frontend repo:** https://github.com/AOYousufi/NC-news-FE

## Tech stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Database | PostgreSQL |
| Database client | pg / node-postgres |
| Password hashing | Node.js crypto / scrypt |
| Authentication | Signed HS256 bearer tokens |
| Testing | Jest + Supertest + PostgreSQL |
| CI | GitHub Actions |
| Hosting | Render |

## Product capabilities

### Accounts and profiles

- registration/login with password hashing
- session restoration through bearer tokens
- profile editing with display name, avatar and bio
- pinned/featured article on public profiles
- password changes and account deletion
- public contribution statistics and activity tabs

### Publishing

- create, edit and publish articles
- private drafts
- revision history
- ownership enforced in the API
- soft deletion so removed content disappears publicly without destroying moderation/history data
- reading-time and editor-preview support on the frontend

### Voting and reactions

- persistent per-user Agree/Disagree voting
- instant vote switching/removal
- self-voting blocked
- article reactions: **Insightful**, **Useful** and **Funny**
- one active reaction per user/article, with switching/removal
- persistent comment voting

### Discussion

- comments and threaded replies
- comment editing
- soft-deleted comment tombstones so reply trees remain intact
- @mentions that generate in-app notifications
- ownership checks on edits/deletes

### Discovery

- search across article title/body/author
- topic, author and date-range filtering
- sorting + pagination metadata
- Hot/Trending article ranking using votes, comments and freshness
- trending topics
- "More like this" recommendations
- user follows
- topic follows
- personalised feed from followed writers **and** topics

### Reading lists

- simple Saved/bookmark state
- private named collections
- create/rename/delete collections
- add/remove published articles from collections

### Notifications

- follow notifications
- comment/reply notifications
- article vote notifications
- @mention notifications
- unread count
- mark one/all as read

### Moderation

- report articles/comments
- moderator role
- moderation queue
- resolve/dismiss reports
- platform analytics
- moderator audit history

## Access model

Guests are read-only. Protected actions require:

```text
Authorization: Bearer <token>
```

Authorship and ownership come from the authenticated token. The API never trusts a client-supplied username for protected mutations.

## Important endpoint groups

| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/articles` | Public |
| GET | `/api/articles/trending` | Public |
| GET | `/api/articles/feed` | Authenticated |
| GET | `/api/articles/drafts` | Authenticated |
| POST | `/api/articles` | Authenticated |
| GET | `/api/articles/:article_id` | Public |
| GET | `/api/articles/:article_id/recommendations` | Public |
| GET | `/api/articles/:article_id/reactions` | Public |
| GET/PATCH | `/api/articles/:article_id/reaction` | Authenticated |
| GET | `/api/articles/:article_id/comments` | Public |
| POST | `/api/articles/:article_id/comments` | Authenticated |
| PATCH | `/api/articles/:article_id` | Authenticated |
| DELETE | `/api/articles/:article_id` | Owner only |
| PATCH | `/api/comments/:comment_id` | Owner only |
| DELETE | `/api/comments/:comment_id` | Owner only |
| GET | `/api/topics/trending` | Public |
| POST/DELETE | `/api/topics/:slug/follow` | Authenticated |
| GET | `/api/collections` | Authenticated |
| POST | `/api/collections` | Authenticated |
| GET/PATCH/DELETE | `/api/collections/:collection_id` | Owner only |
| GET | `/api/users/:username` | Public |
| GET/PATCH | `/api/users/me` | Authenticated |
| GET | `/api/users/me/activity` | Authenticated |
| GET | `/api/users/me/notifications` | Authenticated |
| GET | `/api/moderation/analytics` | Moderator only |
| GET | `/api/moderation/audit` | Moderator only |

`GET /api/articles` supports `topic`, `author`, `search`, `date_from`, `date_to`, `sort_by`, `order`, `limit` and `p`.

## Deletion semantics

Article and comment deletion is intentionally non-destructive:

- deleting an article sets `deleted_at`; public reads no longer return it
- deleting a comment replaces the visible body with `[deleted]` and preserves the reply tree
- moderation/report history can still reference the underlying records

## Reliability and production hardening

- `/healthz` reports process health
- `/readyz` verifies PostgreSQL connectivity
- every request receives an `X-Request-Id`
- structured JSON request logging
- authentication/write rate limiting
- parameterised SQL
- explicit ownership checks
- versioned migrations via `schema_migrations`
- migrations run twice in CI to prove idempotency
- destructive seeding is restricted to development/test workflows

## CI

The backend workflow runs on Node 24 and PostgreSQL 16:

1. `npm ci`
2. database setup
3. development seed
4. migrations
5. migrations again to verify idempotency
6. full Jest/Supertest suite against PostgreSQL

## Local setup

```bash
git clone https://github.com/AOYousufi/NC-News-BE.git
cd NC-News-BE
npm install
```

Create `.env.development`:

```text
PGDATABASE=nc_news
JWT_SECRET=replace-with-a-long-random-secret
```

Create `.env.test`:

```text
PGDATABASE=nc_news_test
JWT_SECRET=test-secret
```

Then run:

```bash
npm run setup-dbs
npm run seed
npm run migrate
npm test
```

For a local portfolio reset:

```bash
npm run demo:reset
```

Never run the destructive seed workflow against production.

## Production

Render/production must provide:

- `DATABASE_URL`
- `JWT_SECRET`

Production schema changes use only:

```bash
npm run migrate
```

### CORS

The deployed frontend origin is allowed by default. To use a custom domain or additional trusted browser origins, set a comma-separated `CORS_ORIGINS` value, for example:

```text
CORS_ORIGINS=https://news.example.com,https://staging.example.com
```

Local development allows the Vite dev/preview origins on ports 5173 and 4173. Requests without a browser `Origin` header remain available for server-to-server clients and command-line API testing.

## Engineering docs

- [Architecture](docs/ARCHITECTURE.md)
- [Demo workflow](docs/DEMO.md)
