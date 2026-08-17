import Database from 'better-sqlite3';
import express, { type Request, type Response } from 'express';
import { existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { z } from 'zod';

import { STATUSES } from './constants.js';
import { DB_PATH } from './db.js';

const PORT = Number(process.env.PORT ?? 3001);

if (!existsSync(DB_PATH)) {
  throw new Error(`No existe la base en ${DB_PATH}. Corré \`npm run seed\` primero.`);
}

const db = new Database(DB_PATH);

interface RecordRow {
  id: string;
  name: string;
  amount: number;
  currency: string;
  status: string;
  dueDate: string;
  createdAt: string;
}

interface Cursor {
  sortValue: string;
  id: string;
}

type SortDir = 'asc' | 'desc';
type Edge = 'after' | 'before';

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD');

const filterSchema = z
  .object({
    status: z.enum(STATUSES).optional(),
    from: dateOnly.optional(),
    to: dateOnly.optional(),
  })
  .refine((data) => !data.from || !data.to || data.from <= data.to, {
    message: 'from must be <= to',
  });

const recordsQuerySchema = filterSchema.and(
  z
    .object({
      pageSize: z.coerce.number().int().min(1).max(100).default(25),
      sort: z.enum(['createdAt:asc', 'createdAt:desc']).default('createdAt:desc'),
      cursor: z.string().optional(),
      edge: z.enum(['after', 'before']).optional(),
    })
    .refine((data) => (data.cursor == null) === (data.edge == null), {
      message: 'cursor and edge must be provided together',
    }),
);

/** Filter WHERE fragment shared by GET /records and GET /records/count, so they can't drift apart. */
function buildFilterWhere(filter: { status?: string; from?: string; to?: string }) {
  const conditions: string[] = [];
  const params: unknown[] = [];
  if (filter.status) {
    conditions.push('status = ?');
    params.push(filter.status);
  }
  if (filter.from) {
    conditions.push('created_at >= ?');
    params.push(`${filter.from}T00:00:00.000Z`);
  }
  if (filter.to) {
    conditions.push('created_at <= ?');
    params.push(`${filter.to}T23:59:59.999Z`);
  }
  return { clause: conditions.join(' AND '), params };
}

function encodeCursor(cursor: Cursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString('base64url');
}

function decodeCursor(raw: string): Cursor {
  const json: unknown = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
  const parsed = z.object({ sortValue: z.string(), id: z.string() }).parse(json);
  return parsed;
}

/** The direction we actually scan the index in for this request — flipped for `edge=before`, then the result is reversed back. */
function scanDirectionFor(sortDir: SortDir, edge?: Edge): SortDir {
  if (edge === 'before') return sortDir === 'asc' ? 'desc' : 'asc';
  return sortDir;
}

/** Keyset seek predicate: `(created_at, id)` strictly past the cursor, in scan order. */
function buildKeysetWhere(scanDir: SortDir, cursor: Cursor | null) {
  if (!cursor) return { clause: '', params: [] as unknown[] };
  const op = scanDir === 'desc' ? '<' : '>';
  return { clause: `(created_at, id) ${op} (?, ?)`, params: [cursor.sortValue, cursor.id] };
}

function sendError(res: Response, status: number, message: string) {
  res.status(status).json({ error: { message } });
}

const app = express();

app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  next();
});

app.get('/records', (req: Request, res: Response) => {
  const parsed = recordsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return sendError(res, 400, parsed.error.issues.map((issue) => issue.message).join('; '));
  }
  const { pageSize, status, from, to, sort, cursor: rawCursor, edge } = parsed.data;
  const [, sortDir] = sort.split(':') as ['createdAt', SortDir];

  let cursor: Cursor | null = null;
  if (rawCursor) {
    try {
      cursor = decodeCursor(rawCursor);
    } catch {
      return sendError(res, 400, 'invalid cursor');
    }
  }

  const scanDir = scanDirectionFor(sortDir, edge);
  const filter = buildFilterWhere({ status, from, to });
  const keyset = buildKeysetWhere(scanDir, cursor);
  const whereParts = [filter.clause, keyset.clause].filter(Boolean);
  const whereSql = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';
  const orderDir = scanDir.toUpperCase();

  const rows = db
    .prepare(
      `SELECT id, name, amount, currency, status, due_date AS dueDate, created_at AS createdAt
       FROM records
       ${whereSql}
       ORDER BY created_at ${orderDir}, id ${orderDir}
       LIMIT ?`,
    )
    .all(...filter.params, ...keyset.params, pageSize + 1) as RecordRow[];

  const hasMoreInScanDirection = rows.length > pageSize;
  const pageRows = rows.slice(0, pageSize);
  const orderedRows = edge === 'before' ? pageRows.slice().reverse() : pageRows;

  const hasNextPage = edge === 'before' ? true : hasMoreInScanDirection;
  const hasPreviousPage = edge === 'before' ? hasMoreInScanDirection : cursor !== null;

  res.json({
    data: orderedRows,
    pageInfo: {
      pageSize,
      startCursor: orderedRows.length
        ? encodeCursor({ sortValue: orderedRows[0]!.createdAt, id: orderedRows[0]!.id })
        : null,
      endCursor: orderedRows.length
        ? encodeCursor({
            sortValue: orderedRows[orderedRows.length - 1]!.createdAt,
            id: orderedRows[orderedRows.length - 1]!.id,
          })
        : null,
      hasNextPage,
      hasPreviousPage,
    },
  });
});

app.get('/records/count', (req: Request, res: Response) => {
  const parsed = filterSchema.safeParse(req.query);
  if (!parsed.success) {
    return sendError(res, 400, parsed.error.issues.map((issue) => issue.message).join('; '));
  }
  const filter = buildFilterWhere(parsed.data);
  const whereSql = filter.clause ? `WHERE ${filter.clause}` : '';
  const row = db.prepare(`SELECT COUNT(*) AS total FROM records ${whereSql}`).get(...filter.params) as {
    total: number;
  };
  res.json({ total: row.total });
});

app.use((err: unknown, _req: Request, res: Response, _next: express.NextFunction) => {
  sendError(res, 500, err instanceof Error ? err.message : 'Internal server error');
});

const isMainModule = process.argv[1] != null && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMainModule) {
  app.listen(PORT, () => {
    process.stdout.write(`http://localhost:${PORT}/records\n`);
  });
}

export { app };
