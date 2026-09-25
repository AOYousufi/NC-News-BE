# NC News - Backend API

A RESTful news API built with **Node.js**, **Express** and **PostgreSQL** during the Northcoders Full-Stack Software Development bootcamp.

It supports articles, comments, topics and users, with filtering, sorting and pagination on key endpoints.

## Links

- **Live API:** [nc-news-vvdv.onrender.com/api](https://nc-news-vvdv.onrender.com/api)
- **Frontend:** [nc-news-sultan.netlify.app](https://nc-news-sultan.netlify.app/)
- **Frontend repo:** [github.com/AOYousufi/NC-news-FE](https://github.com/AOYousufi/NC-news-FE)

> The API is hosted on Render's free tier, so the first request may take a short while to wake up.

## Tech stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Database | PostgreSQL |
| Database client | pg (node-postgres) |
| Testing | Jest + Supertest |

## API endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api` | List all available endpoints |
| GET | `/api/topics` | Get all topics |
| GET | `/api/articles` | Get articles with sorting, filtering and pagination |
| GET | `/api/articles/:id` | Get an article by ID |
| GET | `/api/articles/:id/comments` | Get comments for an article |
| POST | `/api/articles/:id/comments` | Post a comment |
| PATCH | `/api/articles/:id` | Update article votes |
| DELETE | `/api/comments/:id` | Delete a comment |
| GET | `/api/users` | Get all users |
| GET | `/api/users/:username` | Get a user by username |

## Local setup

```bash
git clone https://github.com/AOYousufi/NC-News-BE.git
cd NC-News-BE
npm install
```

Create the following environment files:

**.env.development**
```
PGDATABASE=nc_news
```

**.env.test**
```
PGDATABASE=nc_news_test
```

Then set up the databases and run the tests:

```bash
npm run setup-dbs
npm run seed
npm run app-test
```

## Testing

The API uses **Jest** and **Supertest** for integration testing. Tests run against a separate test database and reseed before test suites to keep results isolated.

## Requirements

- Node.js v18+
- PostgreSQL v14+

Built as part of the Northcoders Full-Stack Software Development bootcamp.
