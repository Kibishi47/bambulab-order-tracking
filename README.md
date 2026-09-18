# BambuShare 🧵 • Suivi des Commandes Groupées Bambu Lab

> Application web moderne, épurée et autonome conçue pour centraliser les besoins et gérer les commandes groupées de filaments 3D (Bambu Lab) d'un groupe d'amis, avec calcul automatique des soldes et simplification des remboursements ("Qui doit quoi à qui").

---

## ✨ Fonctionnalités Clés

1. **👥 Annuaire des membres** :
   - CRUD complet des amis participant aux commandes groupées.
   - Suivi des coordonnées (email, téléphone, adresse/lieu de remise habituel).
   - Soldes nets et statistiques individuelles en temps réel.

2. **🧵 Gestion continue des besoins (au fil de l'eau)** :
   - **Ajout & Édition complète** : Matière (PLA Basic, PLA Matte, PETG HF, TPU 95A, ABS, PETG-CF, etc.), conditionnement (Recharge éco vs Bobine avec spool), couleur (palette Bambu Lab ou sélecteur personnalisé), quantité, prix estimé, statut et notes de projet.
   - **Action Modifier (crayon)** sur chaque besoin pour ajuster n'importe quel paramètre ou changer manuellement le statut.
   - **Cycle de vie complet** : `DEMANDE` ➔ `PRIS_EN_CHARGE` ➔ `COMMANDE` ➔ `RECU` ➔ `DISTRIBUE` (avec bouton d'avancement rapide et annulation).
   - Filtres dynamiques et détection du seuil avantageux (>= 10 bobines en attente pour remise quantitative maximale).

3. **📦 Commandes groupées & Avance des fonds** :
   - Sélection assistée des besoins en attente pour créer le panier Bambu Lab.
   - Désignation du membre acheteur qui avance les fonds.
   - Renseignement du montant réel facturé, de la date d'achat, des frais de port et du numéro de commande (#FR...).
   - Ventilation claire des coûts par membre dans la fiche commande.

4. **⚖️ Calcul des soldes & Remboursements ("Qui doit quoi à qui")** :
   - Formule du solde net : $(\text{Total avancé}) - (\text{Total consommé}) + (\text{Remboursements versés}) - (\text{Remboursements reçus})$.
   - **Algorithme de simplification des dettes** : Minimise les flux et indique directement qui doit virer combien à qui (ex : *Lucas doit 33,98 € à Thomas*).
   - Bouton d'action "Solder" en 1 clic pour pré-remplir le règlement.
   - Historique complet et transparent de tous les règlements (Lydia, PayPal, virement bancaire, espèces).

5. **🎨 Design Épuré & Thème Clair / Sombre** :
   - Design inspiré du matériel sobre Bambu Lab : aucun halo fluo ou texte néon.
   - Toggle Clair/Sombre dans le header avec mémorisation (`localStorage`) et respect du thème système (`prefers-color-scheme`).
   - Favicon modulaire SVG officiel Bambu (`/favicon.svg`).

---

## 🛠 Stack Technique (Politique Zéro Bloat)

- **Framework** : [Nuxt 3](https://nuxt.com/) (Vue 3 Composition API + routes d'API Nitro serveur).
- **Base de Données** : [SQLite](https://www.sqlite.org/) local avec [Drizzle ORM](https://orm.drizzle.team/) et `better-sqlite3` (mode WAL, clés étrangères actives).
- **Design & UI** : [Tailwind CSS](https://tailwindcss.com/) avec `darkMode: 'class'`.
- **Icônes** : `lucide-vue-next`.
- **Persistance & Déploiement** : Docker multi-stage Alpine optimisé + `docker-compose.yml` prêt pour [Coolify](https://coolify.io/).

---

## 🚀 Démarrage Rapide en Local

### Prérequis
- Node.js 20+ ou 22+
- npm

### Installation
```bash
# Cloner le dépôt
git clone <repo-url>
cd bambulab-order-tracking

# Installer les dépendances
npm install

# (Facultatif) Peupler la base avec des données de test
npm run db:seed

# Lancer le serveur de développement
npm run dev
```

L'application est accessible sur [http://localhost:3000](http://localhost:3000).

### Build de Production Local
```bash
npm run build
npm run preview
```

---

## 🛡️ Qualité de Code & Intégration Continue (CI)

Le projet dispose d'une suite de vérification statique stricte et d'un pipeline d'intégration continue **GitHub Actions** (`.github/workflows/ci.yml`) déclenché à chaque push ou pull request sur `main` :

- **TypeScript strict** : vérification complète des types via `vue-tsc --noEmit`.
- **Audit statique (Knip)** : détection du code mort, des fichiers et des dépendances inutilisés.
- **Contrôle anti-duplication (jscpd)** : détection des copier-coller suspects (`threshold: 5%`).
- **Build de validation** : compilation complète Nuxt & Nitro pour garantir l'absence de régression.

### Commandes Locales
```bash
# Lancer l'intégralité des vérifications locales
make check
# ou
npm run check

# Commandes unitaires
make typecheck    # npm run typecheck
make audit        # npm run audit
make duplicates   # npm run duplicates
```

---

## 🔒 Sécurisation de la Base de Données (Zero Seeding en Production)

- **Au démarrage de l'application / conteneur** : seules les migrations de structure de tables sont appliquées automatiquement (`CREATE TABLE IF NOT EXISTS`).
- **Aucune donnée de démo n'est insérée en production**.
- Pour alimenter une base de développement, lancez manuellement :
  ```bash
  npm run db:seed
  # ou avec la variable d'environnement :
  RUN_SEED=true npm run dev
  ```

---

## 🐳 Déploiement avec Docker & Coolify

L'application utilise un `Dockerfile` multi-stage optimisé pour Alpine :
- **Stage Builder** : installe `python3 make g++` pour compiler nativement `better-sqlite3`, met à jour npm et exécute `npm ci`.
- **Stage Runner** : image ultra-légère `node:22-alpine` avec `curl` et `libstdc++` (requis pour les modules C++ natifs), exécutée sous l'utilisateur sécurisé non-root `node`.

### Déploiement via Docker Compose
```bash
docker compose up -d --build
```

### Configuration Coolify
1. Créez une nouvelle ressource : **Application** ➔ **Public/Private Repository**.
2. Type de build : **Dockerfile** ou **Docker Compose**.
3. **Volume persistant** (critique pour SQLite) :
   - Monter `/app/data` (ex: `bambulab_data:/app/data` ou `./data:/app/data`).
4. **Port exposé** : `3000`.
5. **Healthcheck** : `/api/health`.
6. Variables d'environnement optionnelles :
   - `DATABASE_PATH=/app/data/bambulab.db` (défaut)
   - `NODE_ENV=production`

---

## 📜 Licence
MIT
