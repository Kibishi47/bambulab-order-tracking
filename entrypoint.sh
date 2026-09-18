#!/bin/sh
set -e

DB_DIR=$(dirname "${DATABASE_PATH:-/app/data/bambulab.db}")
mkdir -p "$DB_DIR"
chmod -R 777 "$DB_DIR"

# Exécution des migrations Drizzle
npx drizzle-kit migrate 2>/dev/null || true

# Démarrage de l'application Nuxt
exec node .output/server/index.mjs
