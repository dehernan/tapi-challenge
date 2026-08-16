# API del desafío — Frontend tapi

Node + Express con una base SQLite de **1.000.000 de registros**. Corre en su propio
puerto; armá tu proyecto por separado y apuntale acá.

## Levantarlo

```bash
docker build -t tapi-challenge-api .
docker run --rm -p 3001:3001 tapi-challenge-api
```

O sin Docker (Node 22+):

```bash
npm install
npm run seed     # ~10 s
npm start
```

## Lo que expone

```
GET /records
```

Devuelve la tabla completa: ~170 MB de JSON, ~20 s. Va streameado.

```json
{
  "id": "rec_000000001",
  "name": "Factura Codensa Residencial",
  "amount": 3527048,
  "currency": "PEN",
  "status": "processing",
  "dueDate": "2025-06-20",
  "createdAt": "2025-03-19T05:15:39.000Z"
}
```

`amount` es un entero en la unidad mínima de la moneda. `currency` es ISO 4217.
`status` ∈ `pending`, `processing`, `paid`, `failed`, `refunded`, `cancelled`.

## Esta API es tuya

Modelala como te parezca: agregá endpoints, cambiá el contrato, elegí la forma de
paginación que quieras. El código está en `src/server.ts` y la base al lado, con SQL a
mano. Lo que hagas acá es parte de la entrega.

## Notas

- El dataset es determinístico: mismos datos en cualquier máquina.
- Si escribís sobre la base y querés volver al original: `docker restart` (o
  `npm run seed`).
- CORS abierto.
- Variables: `PORT` (default `3001`), `DB_PATH`, `RECORDS` (ej. `RECORDS=20000 npm run seed`).
