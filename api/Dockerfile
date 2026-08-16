# Debian slim, no Alpine: `better-sqlite3` es un módulo nativo y compilarlo
# contra musl es una fuente de dolor gratuita.
FROM node:22-slim

# Toolchain para compilar el binding nativo. Se instala y se descarta en la
# misma capa para no arrastrarlo a la imagen final.
WORKDIR /app

COPY package.json ./
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ ca-certificates \
 && npm install --omit=dev --no-audit --no-fund \
 && apt-get purge -y python3 make g++ \
 && apt-get autoremove -y \
 && rm -rf /var/lib/apt/lists/*

COPY tsconfig.json ./
COPY src ./src

# El dataset se hornea en la imagen: todos los candidatos reciben exactamente
# los mismos datos, el contenedor arranca en un segundo y no hay paso de setup.
# Como el contenedor es efímero, `docker restart` devuelve la base impecable.
ARG RECORDS=1000000
RUN RECORDS=${RECORDS} npx tsx src/seed.ts

ENV PORT=3001
EXPOSE 3001

CMD ["npx", "tsx", "src/server.ts"]
