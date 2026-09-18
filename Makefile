.PHONY: help dev db\:migrate db\:reset seed\:minimal seed\:pending seed\:full seed\:clean

help:
	@echo "Commandes disponibles pour BambuShare :"
	@echo "  make dev          - Lancer le serveur de développement Nuxt"
	@echo "  make db:migrate   - Initialiser et appliquer le schéma SQLite local"
	@echo "  make db:reset     - Supprimer la base locale et réinitialiser le schéma à zéro"
	@echo "  make seed:minimal - Injecter 3 membres sans besoin ni commande (tests à vide)"
	@echo "  make seed:pending - Injecter des membres et des besoins en attente de regroupement"
	@echo "  make seed:full    - Injecter le jeu d'essai complet (commandes équitable/prorata, soldes, virements)"
	@echo "  make seed:clean   - Vider toutes les tables sans supprimer le fichier SQLite"

dev:
	npm run dev

db\:migrate:
	npx tsx server/database/migrate.ts

db\:reset:
	rm -f data/bambulab.db data/bambulab.db-wal data/bambulab.db-shm
	npx tsx server/database/migrate.ts

seed\:minimal:
	npx tsx server/database/seeds/minimal.ts

seed\:pending:
	npx tsx server/database/seeds/pending.ts

seed\:full:
	npx tsx server/database/seeds/full.ts

seed\:clean:
	npx tsx server/database/seeds/clean.ts
test:error:
	curl -s "http://localhost:3000/api/test-error?type=404" && echo "\nTest error endpoint available"
