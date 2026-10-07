# NC News - Backend API

A RESTful news API built with **Node.js**, **Express** and **PostgreSQL** during the Northcoders Full-Stack Software Development bootcamp.

The API supports articles, comments, topics and users, with public read access and simple authenticated write access.

## Links

- **Live API:** https://nc-news-vvdv.onrender.com/api
- **Frontend:** https://nc-news-sultan.netlify.app/
- **Frontend repo:** https://github.com/AOYousufi/NC-news-FE

> Render's free tier may take a short while to wake up on the first request.

## Tech stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Database | PostgreSQL |
| Database client | pg (node-postgres) |
| Password hashing | Node.js crypto / scrypt |
| Authentication | Signed HS256 bearer tokens |
| Testing | Jest + Supertest |

## Access model

Guests are read-only. Public endpoints include articles, article comments, topics and public user profiles.

Registered users can log in and use protected write endpoints. Send the token returned by registration/login as:

```text
Authorization: Bearer <token>
```

Protected actions currently include:

- saving/bookmarking articles
- following users and reading a personalised feed
- managing private article drafts
- viewing a private activity dashboard

- creating articles
- editing your own articles
- deleting your own articles
- posting comments and threaded replies
- voting on other users' articles with one stored vote per user
- creating new topics
- deleting your own comments
- reading/updating your own profile

A user cannot delete another user's article or comment. Article and comment authorship are derived from the authenticated token rather than trusting a username sent by the client.

Article creation accepts `title`, `topic`, `body` and an optional `article_img_url`. Existing vote updates remain compatible with `PATCH /api/articles/:article_id` using only `{ "inc_votes": 1 }`. Owner content edits use the same route with one or more of `title`, `topic`, `body` and `article_img_url`; mixing vote and content fields is rejected. Deleting an article also removes its comments in the same transaction.

## Main endpoints

| Method | Endpoint | Access |
|---|---|---|
| GET | `/api` | Public |
| GET | `/api/topics` | Public |
| GET | `/api/articles` | Public |
| GET | `/api/articles/feed` | Authenticated |
| GET | `/api/articles/drafts` | Authenticated |
| POST | `/api/articles` | Authenticated |
| GET | `/api/articles/:article_id` | Public |
| GET | `/api/articles/:article_id/comments` | Public |
| POST | `/api/articles/:article_id/comments` | Authenticated |
| PATCH | `/api/articles/:article_id` | Authenticated / owner for content edits |
| DELETE | `/api/articles/:article_id` | Owner only |
| DELETE | `/api/comments/:comment_id` | Owner only |
| GET | `/api/users` | Public |
| GET | `/api/users/:username` | Public |
| POST | `/api/users/register` | Public |
| POST | `/api/users/signup` | Public compatibility alias |
| POST | `/api/users/login` | Public |
| GET | `/api/users/me` | Authenticated |
| GET | `/api/users/me/activity` | Authenticated |
| GET | `/api/users/me/saved` | Authenticated |
| GET | `/api/users/me/following` | Authenticated |
| PATCH | `/api/users/me` | Authenticated |

`GET /api/articles` supports `topic`, `author`, `sort_by`, `order`, and optional `limit`/`p` pagination. Authenticated users can create topics with `POST /api/topics`. Voting uses `PATCH /api/articles/:article_id` with `{ "inc_votes": 1 }` or `{ "inc_votes": -1 }`; the API stores one vote state per user, supports switching/toggling without duplicate votes, and blocks self-voting. `GET /api/articles/:article_id/vote` restores the signed-in user's current vote state. Pagination is only applied when `limit` or `p` is supplied, so the previous default frontend behaviour is preserved.

## Frontend integration changes

The existing public GET response shapes are preserved. The frontend needs changes only around authenticated functionality:

- registration/signup now requires a password
- registration and login return a `token`
- protected requests must include the bearer token
- posting comments no longer needs to trust/send a username for authorship
- voting requires login
- article creation uses the authenticated user as author
- article content edits and deletion require article ownership
- comment deletion requires login and ownership
- API error responses use `{ "msg": "..." }` consistently
- successful article vote updates now use HTTP `200`

`FRONTEND_INTEGRATION.md` is intentionally ignored by Git so a detailed local migration checklist can be maintained without publishing it.

## Engineering docs

- Architecture and data-flow guide: `docs/ARCHITECTURE.md`
- Portfolio/demo walkthrough: `docs/DEMO.md`

The API also exposes `/healthz` for process health and `/readyz` for database readiness. Production migrations are version-tracked in `schema_migrations`.

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
JWT_SECRET=test-secret-if-you-want-to-override-the-built-in-test-value
```

Then run:

```bash
npm run setup-dbs
npm run seed
npm run migrate
npm test
```

Seeded development/test users use `password123` so authentication can be tested locally. This is development seed data only and must not be used as a real production password.

Existing users in a pre-auth production database are migrated as locked legacy accounts rather than being assigned a shared password. New accounts should be created through the registration endpoint.

For Render/production, configure `DATABASE_URL` and `JWT_SECRET` as environment variables.

## Error handling

Expected API failures return a consistent JSON body:

```json
{ "msg": "Bad Request" }
```

The API handles malformed identifiers, invalid query values, missing resources, authentication failures, ownership failures, PostgreSQL constraint errors, unknown routes and unexpected server errors without exposing stack traces to clients.

## Requirements

- Node.js v18+
- PostgreSQL v14+

Built as part of the Northcoders Full-Stack Software Development bootcamp.

## Product features

The API now supports private draft articles, saved/bookmarked articles, user following with a personalised feed, threaded comment replies via `parent_comment_id`, and a private activity dashboard. Public article queries exclude drafts. Drafts can only be retrieved through authenticated owner endpoints until published.

## Demo reset

For local portfolio demonstrations, `npm run demo:reset` recreates and reseeds the development databases. Do not use destructive seed commands against production.
