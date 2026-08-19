# Records API

Node + Express over a SQLite database of **1,000,000 records**. Runs on its
own port; the frontend is a separate project that points at it.

This started as the API provided with the challenge, which exposed a single
unpaginated `GET /records` that streamed the entire table (~170 MB of JSON,
~20 s). Reshaping it was part of the exercise —
[`ARCHITECTURE.md`](../ARCHITECTURE.md) explains the reasoning behind the
contract below.

## Running it

```bash
docker build -t tapi-challenge-api .
docker run --rm -p 3001:3001 tapi-challenge-api
```

Or without Docker (Node 22+):

```bash
npm install
npm run seed     # ~10 s
npm start        # http://localhost:3001
```

## `GET /records`

Returns one keyset-paginated page of records.

| Param      | Type                                | Default           | Notes                                             |
| ---------- | ----------------------------------- | ----------------- | ------------------------------------------------- |
| `pageSize` | int, 1–100                          | `25`              |                                                   |
| `status`   | one of the 6 statuses               | —                 | Exact match                                       |
| `from`     | `YYYY-MM-DD`                        | —                 | `createdAt` ≥ start of that day (UTC), inclusive  |
| `to`       | `YYYY-MM-DD`                        | —                 | `createdAt` ≤ end of that day (UTC), inclusive    |
| `sort`     | `createdAt:asc` \| `createdAt:desc` | `createdAt:desc`  | Only `createdAt` is sortable so far               |
| `cursor`   | opaque string                       | —                 | From a previous response's `pageInfo`             |
| `edge`     | `after` \| `before`                 | —                 | Required with `cursor`, and only with it          |

Filters combine with AND. `from` must be ≤ `to`.

**Pagination.** Omit `cursor`/`edge` for the first page. To move forward,
pass the current page's `endCursor` with `edge=after`; to move back, pass its
`startCursor` with `edge=before`. The cursor is a base64 `{ sortValue, id }`
pair — treat it as opaque. It's only valid within the filter+sort combination
it was issued for; changing a filter or the sort direction means starting from
the first page again.

```jsonc
{
  "data": [
    {
      "id": "rec_000738944",
      "name": "Recarga Naturgy Comercial",
      "amount": 3416,
      "currency": "CLP",
      "status": "pending",
      "dueDate": "2026-08-21",
      "createdAt": "2026-06-29T23:59:58.000Z"
    }
    // …
  ],
  "pageInfo": {
    "pageSize": 25,
    "startCursor": "eyJzb3J0VmFsdWUiOi…",
    "endCursor": "eyJzb3J0VmFsdWUiOi…",
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

`amount` is an integer in the currency's minor unit. `currency` is ISO 4217
(`ARS`, `MXN`, `CLP`, `COP`, `PEN`, `USD` — note `CLP` has 0 minor units, so
don't assume a fixed divisor). `status` ∈ `pending`, `processing`, `paid`,
`failed`, `refunded`, `cancelled`.

## `GET /records/count`

Returns how many records match a filter. Takes `status`, `from` and `to` with
the same meaning as above — no pagination or sort params, since neither
changes the count.

```json
{ "total": 460639 }
```

It's deliberately separate from `GET /records` rather than embedded in every
page response; see [`ARCHITECTURE.md`](../ARCHITECTURE.md) for why.

## Errors

Invalid query params return `400` with:

```json
{ "error": { "message": "cursor and edge must be provided together" } }
```

## Tests

```bash
npm test
```

Integration tests over both endpoints, run against a real SQLite database
seeded on the fly (`RECORDS=500` into a temp file) rather than a mocked one
— see the Testing section of [`ARCHITECTURE.md`](../ARCHITECTURE.md) for why.
No need to run `npm run seed` first; the suite builds its own database and
leaves the one used by `npm start` untouched.

## Notes

- The dataset is deterministic: same data on every machine.
- To restore the database after writing to it: `docker restart` (or
  `npm run seed`).
- CORS is open.
- Env vars: `PORT` (default `3001`), `DB_PATH`, `RECORDS`
  (e.g. `RECORDS=20000 npm run seed` for a smaller local dataset).
- `seed.ts` also creates the indexes the query patterns above rely on, so
  re-seeding is what keeps them in place.
