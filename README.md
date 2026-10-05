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

- posting comments
- voting on articles
- deleting your own comments
- reading/updating your own profile

A user cannot delete another user's comment. The backend derives comment authorship from the authenticated token rather than trusting a username sent by the client.

## Main endpoints

| Method | Endpoint | Access |
|---|---|---|
| GET | `/api` | Public |
| GET | `/api/topics` | Public |
| GET | `/api/articles` | Public |
| GET | `/api/articles/:article_id` | Public |
| GET | `/api/articles/:article_id/comments` | Public |
| POST | `/api/articles/:article_id/comments` | Authenticated |
| PATCH | `/api/articles/:article_id` | Authenticated |
| DELETE | `/api/comments/:comment_id` | Owner only |
| GET | `/api/users` | Public |
| GET | `/api/users/:username` | Public |
| POST | `/api/users/register` | Public |
| POST | `/api/users/signup` | Public compatibility alias |
| POST | `/api/users/login` | Public |
| GET | `/api/users/me` | Authenticated |
| PATCH | `/api/users/me` | Authenticated |

`GET /api/articles` supports `topic`, `author`, `sort_by`, `order`, and optional `limit`/`p` pagination. Pagination is only applied when `limit` or `p` is supplied, so the previous default frontend behaviour is preserved.

## Frontend integration changes

The existing public GET response shapes are preserved. The frontend needs changes only around authenticated functionality:

- registration/signup now requires a password
- registration and login return a `token`
- protected requests must include the bearer token
- posting comments no longer needs to trust/send a username for authorship
- voting requires login
- comment deletion requires login and ownership
- API error responses use `{ "msg": "..." }` consistently
- successful article vote updates now use HTTP `200`

`FRONTEND_INTEGRATION.md` is intentionally ignored by Git so a detailed local migration checklist can be maintained without publishing it.

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
