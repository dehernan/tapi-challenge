import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { app as App } from './server.js';

let app: typeof App;
let tmpDir: string;

interface RecordDto {
  id: string;
  createdAt: string;
}

interface RecordsResponse {
  data: RecordDto[];
  pageInfo: {
    pageSize: number;
    startCursor: string | null;
    endCursor: string | null;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

beforeAll(async () => {
  tmpDir = mkdtempSync(join(tmpdir(), 'tapi-api-test-'));
  const dbPath = join(tmpDir, 'records.db');
  execFileSync('npx', ['tsx', 'src/seed.ts'], {
    env: { ...process.env, RECORDS: '500', DB_PATH: dbPath },
    stdio: 'ignore',
  });
  process.env.DB_PATH = dbPath;
  ({ app } = await import('./server.js'));
});

afterAll(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

function isSortedDesc(rows: RecordDto[]) {
  return rows.every((row, i) => i === 0 || rows[i - 1]!.createdAt >= row.createdAt);
}

function isSortedAsc(rows: RecordDto[]) {
  return rows.every((row, i) => i === 0 || rows[i - 1]!.createdAt <= row.createdAt);
}

describe('GET /records', () => {
  it('returns a default-sized first page with no previous page', async () => {
    const res = await request(app).get('/records');
    expect(res.status).toBe(200);
    const body = res.body as RecordsResponse;
    expect(body.data).toHaveLength(25);
    expect(body.pageInfo.pageSize).toBe(25);
    expect(body.pageInfo.hasPreviousPage).toBe(false);
    expect(body.pageInfo.hasNextPage).toBe(true);
    expect(isSortedDesc(body.data)).toBe(true);
  });

  it('pages forward with no overlap, and back again reproduces the exact same page', async () => {
    const first = (await request(app).get('/records?pageSize=5')).body as RecordsResponse;

    const next = (
      await request(app).get(`/records?pageSize=5&cursor=${first.pageInfo.endCursor}&edge=after`)
    ).body as RecordsResponse;
    const firstIds = new Set(first.data.map((r) => r.id));
    expect(next.data.every((r) => !firstIds.has(r.id))).toBe(true);
    expect(next.pageInfo.hasPreviousPage).toBe(true);

    const back = (
      await request(app).get(`/records?pageSize=5&cursor=${next.pageInfo.startCursor}&edge=before`)
    ).body as RecordsResponse;
    expect(back.data.map((r) => r.id)).toEqual(first.data.map((r) => r.id));
    expect(back.pageInfo.hasPreviousPage).toBe(false);
  });

  it('sorts ascending when asked', async () => {
    const res = await request(app).get('/records?pageSize=10&sort=createdAt:asc');
    const body = res.body as RecordsResponse;
    expect(isSortedAsc(body.data)).toBe(true);
  });

  it('paging through every page yields exactly as many rows as /records/count reports', async () => {
    const countRes = await request(app).get('/records/count?status=paid');
    const total = (countRes.body as { total: number }).total;

    const seen = new Set<string>();
    let cursor: string | null = null;
    let edge: 'after' | null = null;
    for (let guard = 0; guard < 100; guard++) {
      const qs = new URLSearchParams({ pageSize: '50', status: 'paid' });
      if (cursor) qs.set('cursor', cursor);
      if (edge) qs.set('edge', edge);
      const res = await request(app).get(`/records?${qs.toString()}`);
      const body = res.body as RecordsResponse;
      for (const row of body.data) seen.add(row.id);
      if (!body.pageInfo.hasNextPage) break;
      cursor = body.pageInfo.endCursor;
      edge = 'after';
    }
    expect(seen.size).toBe(total);
  });

  it.each([
    ['status=bogus', 'status'],
    ['pageSize=0', 'pageSize'],
    ['pageSize=101', 'pageSize'],
    ['sort=amount:asc', 'sort'],
    ['cursor=not-valid-base64json', 'cursor'],
    ['cursor=abc', 'edge'],
  ])('rejects invalid %s with 400', async (query) => {
    const res = await request(app).get(`/records?${query}`);
    expect(res.status).toBe(400);
  });
});

describe('GET /records/count', () => {
  it('narrows as filters are added', async () => {
    const total = ((await request(app).get('/records/count')).body as { total: number }).total;
    const byStatus = ((await request(app).get('/records/count?status=paid')).body as { total: number }).total;
    const byStatusAndDate = (
      (await request(app).get('/records/count?status=paid&from=2026-01-01&to=2026-03-01')).body as {
        total: number;
      }
    ).total;

    expect(byStatus).toBeLessThanOrEqual(total);
    expect(byStatusAndDate).toBeLessThanOrEqual(byStatus);
  });

  it('rejects an invalid date range with 400', async () => {
    const res = await request(app).get('/records/count?from=2026-06-01&to=2026-01-01');
    expect(res.status).toBe(400);
  });
});
