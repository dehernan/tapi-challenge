# tapi-challenge

Records/transactions management panel for tapi's frontend challenge — a
Next.js frontend + an Express/SQLite API. See [`ARCHITECTURE.md`](./ARCHITECTURE.md)
for the design rationale and [`docs/CHALLENGE.md`](./docs/CHALLENGE.md) for
the original brief.

## Prerequisites

- Node 22+
- Docker (optional — only needed to run the API via its Dockerfile instead
  of directly)

## 1. Run the API

The API lives in `api/` and is its own project (own `package.json`, own
dependencies) — see [`api/README.md`](./api/README.md) for the full
endpoint contract and env vars.

**Directly:**

```bash
cd api
npm install
npm run seed     # seeds a 1,000,000-row SQLite DB, ~10s
npm start        # http://localhost:3001
```

**Or with Docker** (bakes the seeded DB into the image at build time):

```bash
cd api
docker build -t tapi-challenge-api .
docker run --rm -p 3001:3001 tapi-challenge-api
```

## 2. Run the frontend

From the repo root:

```bash
npm install
npm run dev       # http://localhost:3000
```

It points at `http://localhost:3001` by default. To point elsewhere, set
`NEXT_PUBLIC_API_URL`.

## Tests

Each project has its own suite:

```bash
npm test            # frontend, from the repo root
(cd api && npm test) # API
```

## Lint & build

```bash
npm run lint
npm run build
```
