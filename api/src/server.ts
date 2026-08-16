import Database from 'better-sqlite3';
import express from 'express';
import { existsSync } from 'node:fs';

import { DB_PATH } from './db.js';

const PORT = Number(process.env.PORT ?? 3001);

if (!existsSync(DB_PATH)) {
  throw new Error(`No existe la base en ${DB_PATH}. Corré \`npm run seed\` primero.`);
}

const db = new Database(DB_PATH);
const app = express();

app.use(express.json({ limit: '5mb' }));
app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  next();
});

app.get('/records', (_req, res) => {
  const rows = db
    .prepare(
      `SELECT id, name, amount, currency, status, due_date AS dueDate, created_at AS createdAt
       FROM records`,
    )
    .iterate();

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.write('[');
  let first = true;
  for (const row of rows) {
    if (!first) res.write(',');
    res.write(JSON.stringify(row));
    first = false;
  }
  res.write(']');
  res.end();
});

app.listen(PORT, () => {
  process.stdout.write(`http://localhost:${PORT}/records\n`);
});
