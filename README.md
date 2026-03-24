# @roastery-capsules/post.post

Post management capsule for the Roastery CMS ecosystem — CRUD operations, pagination, caching, and cookie-based JWT authentication.

[![Checked with Biome](https://img.shields.io/badge/Checked_with-Biome-60a5fa?style=flat&logo=biome)](https://biomejs.dev)

## Overview

**post.post** is a microservice capsule that handles the full lifecycle of blog posts within Roastery CMS. Built on clean architecture principles (Domain, Application, Infrastructure, Presentation), it exposes a RESTful API for creating, reading, updating, and deleting posts with support for pagination, slug-based lookups, caching (Redis), and relationships with post types and tags.

## Architecture

```
src/
├── domain/          # Post entity, value objects, repository interfaces
├── application/     # Use cases (Create, Read, Update, Delete, Count) and DTOs
├── infra/           # Repository implementations (Prisma, In-memory, Cached) and factories
└── presentation/    # Controllers, routes, plugins, and dev bootstrap
```

## Technologies

| Tool | Purpose |
|------|---------|
| [Elysia](https://elysiajs.com) | HTTP framework (via `@roastery/barista`) |
| [Prisma](https://www.prisma.io) | ORM for PostgreSQL (via `@roastery-adapters/post`) |
| [Redis](https://redis.io) | Caching layer (via `@roastery-adapters/cache`) |
| [tsup](https://tsup.egoist.dev) | Bundling to ESM + CJS with `.d.ts` generation |
| [Bun](https://bun.sh) | Runtime, test runner, and package manager |
| [Knip](https://knip.dev) | Unused exports and dependency detection |
| [Husky](https://typicode.github.io/husky) + [commitlint](https://commitlint.js.org) | Git hooks and conventional commit enforcement |

## Installation

```bash
bun add @roastery-capsules/post.post
```

---

## API

All routes are prefixed with `/posts`.

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/posts/` | Create a new post | Yes |
| `GET` | `/posts/` | List posts (paginated) | No |
| `GET` | `/posts/:id-or-slug` | Find a post by ID or slug | No |
| `PATCH` | `/posts/:id-or-slug` | Update a post | Yes |
| `DELETE` | `/posts/:id-or-slug` | Delete a post | Yes |

### Query parameters

| Parameter | Endpoint | Type | Description |
|-----------|----------|------|-------------|
| `page` | `GET /posts/` | `number` | Page number for pagination |
| `type` | `GET /posts/` | `string` | Filter posts by post type ID |
| `update-slug` | `PATCH /posts/:id-or-slug` | `boolean` | Regenerate slug when name changes |

### Response headers

| Header | Description |
|--------|-------------|
| `X-Total-Count` | Total number of posts |
| `X-Total-Pages` | Total pages available |

### Authentication

Protected endpoints require cookie-based JWT authentication. The login endpoint (`POST /auth/login`) sets an HTTP cookie with the JWT token — no `Authorization: Bearer` header is needed. Subsequent requests to protected routes must include this cookie.

```typescript
// Login returns Set-Cookie header
const response = await api.auth.login.post({ email, password });

// Cookies are automatically sent in subsequent requests (browser)
// or manually forwarded:
const cookies = response.headers.getSetCookie();
await api.posts.index.post(body, {
  headers: { cookie: cookies.join("; ") },
});
```

---

## Usage

### As a standalone microservice

```bash
bun run start:dev
```

### As a plugin in another Roastery app

```typescript
import { PostTypeRoutes } from "@roastery-capsules/post.post/presentation/routes";

app.use(
  PostTypeRoutes({
    cacheProvider: "REDIS",
    jwtSecret: JWT_SECRET,
    postRepository,
    postTagRepository,
    postTypeRepository,
    redisUrl: REDIS_URL,
  }),
);
```

---

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | `DEVELOPMENT` or `PRODUCTION` |
| `PORT` | Yes | Server port |
| `JWT_SECRET` | Yes | Secret for JWT signing |
| `AUTH_EMAIL` | Yes | Admin email for authentication |
| `AUTH_PASSWORD` | Yes | Admin password for authentication |
| `DATABASE_PROVIDER` | No | `PRISMA` or `MEMORY` (default: `MEMORY`) |
| `DATABASE_URL` | No | PostgreSQL connection string (required if `PRISMA`) |
| `CACHE_PROVIDER` | No | `REDIS` or `MEMORY` (default: `MEMORY`) |
| `REDIS_URL` | No | Redis connection string (required if `REDIS`) |
| `POST_TYPE_BASE_URL` | No | External post-type service URL |
| `POST_TAG_BASE_URL` | No | External post-tag service URL |

---

## Development

```bash
# Start dev server with hot reload
bun run start:dev

# Run unit tests
bun run test:unit

# Run tests with coverage
bun run test:coverage

# Build for distribution
bun run build

# Check for unused exports and dependencies
bun run knip

# Full setup (build + bun link)
bun run setup
```

## License

MIT
