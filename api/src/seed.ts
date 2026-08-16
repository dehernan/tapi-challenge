import Database from 'better-sqlite3';
import { mkdirSync, rmSync } from 'node:fs';
import { dirname } from 'node:path';

import { STATUSES } from './constants.js';
import { DB_PATH } from './db.js';

const TOTAL = Number(process.env.RECORDS ?? 1_000_000);
const BATCH = 25_000;

/** PRNG determinístico: mismos datos en cualquier máquina y cualquier corrida. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(input: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

const CURRENCIES = [
  ['ARS', 2], ['MXN', 2], ['CLP', 0], ['COP', 2], ['PEN', 2], ['USD', 2],
] as const;

const A = ['Servicio', 'Factura', 'Cuota', 'Recarga', 'Convenio', 'Débito', 'Pago', 'Liquidación', 'Suscripción'];
const B = ['Edenor', 'Metrogas', 'Camuzzi', 'Naturgy', 'Telecom', 'Movistar', 'Claro', 'Aysa', 'Edesur', 'CFE', 'Telmex', 'Aguas Andinas', 'Enel', 'Sedapal', 'EPM', 'Codensa', 'Personal'];
const C = ['Residencial', 'Comercial', 'Industrial', 'Plan Básico', 'Plan Full', 'Zona Norte', 'Zona Sur', 'Corporativo', 'PyME', ''];

const DAY = 86_400_000;
const ANCHOR = Date.parse('2026-06-30T00:00:00.000Z');

function buildRecord(index: number) {
  const id = `rec_${String(index + 1).padStart(9, '0')}`;
  const rng = mulberry32(hashSeed(id));
  const at = <T,>(xs: readonly T[]) => xs[Math.floor(rng() * xs.length)]!;
  const int = (min: number, max: number) => min + Math.floor(rng() * (max - min + 1));

  const [code, minorUnits] = at(CURRENCIES);
  const amount = Math.round((2 + rng() ** 3 * 90_000) * 10 ** minorUnits);

  const r = rng();
  const status =
    r < 0.46 ? 'paid' : r < 0.68 ? 'pending' : r < 0.8 ? 'processing'
    : r < 0.92 ? 'failed' : r < 0.97 ? 'cancelled' : 'refunded';

  const createdAt = ANCHOR - int(0, 730) * DAY - int(0, 86_399) * 1000;
  const dueDate = createdAt + int(-30, 120) * DAY;

  return {
    id,
    name: [at(A), at(B), at(C)].filter(Boolean).join(' '),
    amount,
    currency: code,
    status: status satisfies (typeof STATUSES)[number],
    due_date: new Date(dueDate).toISOString().slice(0, 10),
    created_at: new Date(createdAt).toISOString(),
  };
}

mkdirSync(dirname(DB_PATH), { recursive: true });
for (const suffix of ['', '-wal', '-shm']) rmSync(`${DB_PATH}${suffix}`, { force: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = OFF');
db.pragma('synchronous = OFF');
db.exec(`
  CREATE TABLE records (
    id         TEXT PRIMARY KEY,
    name       TEXT    NOT NULL,
    amount     INTEGER NOT NULL,
    currency   TEXT    NOT NULL,
    status     TEXT    NOT NULL,
    due_date   TEXT    NOT NULL,
    created_at TEXT    NOT NULL
  );
`);

const insert = db.prepare(
  `INSERT INTO records (id, name, amount, currency, status, due_date, created_at)
   VALUES (@id, @name, @amount, @currency, @status, @due_date, @created_at)`,
);
const insertBatch = db.transaction((from: number, to: number) => {
  for (let i = from; i < to; i++) insert.run(buildRecord(i));
});

process.stdout.write(`Generando ${TOTAL.toLocaleString('es-AR')} registros en ${DB_PATH}\n`);
for (let from = 0; from < TOTAL; from += BATCH) {
  const to = Math.min(from + BATCH, TOTAL);
  insertBatch(from, to);
  process.stdout.write(`\r  ${((to / TOTAL) * 100).toFixed(0).padStart(3)}%`);
}
process.stdout.write('\n  compactando…\n');
db.exec('VACUUM');
db.close();
process.stdout.write('Listo\n');
