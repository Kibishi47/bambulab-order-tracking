# Spécifications & Guide d'Intervention pour Agents IA (`AGENTS.md`)

Ce document détaille l'architecture globale, les conventions techniques et les règles métier de l'application **BambuShare** pour toute future intervention d'un agent d'intelligence artificielle ou développeur.

---

## 1. Vue d'Ensemble & Objectifs Métier

L'application permet à un groupe d'amis d'optimiser leurs commandes de filaments sur le store officiel **Bambu Lab** :
- **Commandes groupées** : Atteindre les seuils de frais de port gratuits (>= 55 €) et les remises quantitatives (>= 4 bobines).
- **Avance de trésorerie** : Un seul membre (l'acheteur) passe la commande et paye l'intégralité du panier.
- **Cycle de vie & Édition complète** : Suivi fin de chaque bobine, avec possibilité d'avancement rapide du statut et d'édition complète (matière, couleur, quantité, prix estimé, statut, notes).
- **Remboursements simplifiés ("Qui doit quoi à qui")** : Minimisation du nombre de virements nécessaires pour solder tous les comptes grâce à un algorithme glouton de compensation de dettes.

---

## 2. Architecture Technique

### 2.1 Stack Fondamentale
- **Framework** : Nuxt 3 (Fullstack Vue 3 Composition API + routes d'API Nitro sous `server/api/`).
- **Base de données** : SQLite local avec `better-sqlite3` et `drizzle-orm`.
  - Mode journal : `WAL` (`sqlite.pragma('journal_mode = WAL')`).
  - Clés étrangères actives : `sqlite.pragma('foreign_keys = ON')`.
  - Emplacement par défaut : `data/bambulab.db` (surchargeable via `DATABASE_PATH`).
- **Auto-migration & Sécurité Zero Seeding** :
  - `server/plugins/db.ts` initialise **uniquement** les tables SQLite à chaque démarrage de l'application via `CREATE TABLE IF NOT EXISTS`.
  - Le seed de démo réside de manière isolée dans `server/database/seed.ts` et n'est **jamais** exécuté en production (`npm run db:seed` ou `RUN_SEED=true` en local).
- **UI & Design System** :
  - Tailwind CSS avec mode sombre par classe (`darkMode: 'class'`).
  - Palette sobre inspirée du matériel physique Bambu Lab :
    - Mode clair : `bg-zinc-50`, cartes `bg-white border-zinc-200`, texte `text-zinc-900`.
    - Mode sombre : `bg-zinc-950`, cartes `bg-zinc-900 border-zinc-800`, texte `text-zinc-100`.
    - Accentuation ponctuelle : Vert Bambu `#00AE42` pour les actions primaires et badges actifs (aucun halo lumineux ou néon).
  - Gestion du thème : `composables/useTheme.ts` avec script anti-scintillement dans le `<head>` et persistance `localStorage`.
- **Icônes** : `lucide-vue-next`.
- **Dépendances** : Politique stricte zéro bloat.

---

## 3. Schéma de Données (`server/database/schema.ts`)

### `members`
| Champ | Type | Contraintes | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Identifiant unique |
| `name` | TEXT | NOT NULL | Prénom / Nom |
| `email` | TEXT | NULLABLE | Adresse email |
| `phone` | TEXT | NULLABLE | Numéro de téléphone |
| `dropoff_location` | TEXT | NULLABLE | Lieu habituel de remise |
| `created_at` | TEXT | NOT NULL | Timestamp ISO |

### `group_orders`
| Champ | Type | Contraintes | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Identifiant unique |
| `order_number` | TEXT | NOT NULL | N° commande Bambu Lab (ex: #FR24098765) |
| `buyer_id` | INTEGER | FK `members.id` (CASCADE) | Membre qui avance l'argent |
| `purchase_date` | TEXT | NOT NULL | Date d'achat (YYYY-MM-DD) |
| `status` | TEXT | NOT NULL | `PREPARATION`, `COMMANDE`, `LIVRE`, `CLOTURE` |
| `total_amount` | REAL | NOT NULL | Montant réel payé sur le store (€) |
| `shipping_fee` | REAL | NOT NULL DEFAULT 0 | Frais de port réels (€) |
| `shipping_split_method` | TEXT | NOT NULL DEFAULT 'EQUITABLE' | Mode de répartition des frais : `EQUITABLE` ou `PRORATA` |
| `notes` | TEXT | NULLABLE | Suivi colis, transporteur, etc. |
| `created_at` | TEXT | NOT NULL | Timestamp ISO |

### `filament_demands`
| Champ | Type | Contraintes | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Identifiant unique |
| `member_id` | INTEGER | FK `members.id` (CASCADE) | Membre demandeur (destinataire) |
| `payer_member_id` | INTEGER | NULLABLE, FK `members.id` (SET NULL) | Membre qui prend en charge financièrement (si NULL : `member_id`) |
| `group_order_id` | INTEGER | FK `group_orders.id` (SET NULL) | Commande groupée associée |
| `filament_type` | TEXT | NOT NULL | PLA Basic, PLA Matte, PETG HF, TPU 95A, etc. |
| `format` | TEXT | NOT NULL | `RECHARGE` (refill) ou `BOBINE` (spool) |
| `color_name` | TEXT | NOT NULL | Nom de la couleur |
| `color_hex` | TEXT | NOT NULL | Code hexadécimal (#00AE42, etc.) |
| `quantity` | INTEGER | NOT NULL DEFAULT 1 | Nombre de bobines |
| `estimated_unit_price` | REAL | NOT NULL | Prix unitaire estimé (€) |
| `actual_unit_price` | REAL | NULLABLE | Prix unitaire réel facturé (€) |
| `status` | TEXT | NOT NULL | `DEMANDE`, `PRIS_EN_CHARGE`, `COMMANDE`, `RECU`, `DISTRIBUE`, `ANNULE` |
| `notes` | TEXT | NULLABLE | Contexte, nom de projet, etc. |
| `created_at` | TEXT | NOT NULL | Timestamp ISO |
| `updated_at` | TEXT | NOT NULL | Timestamp ISO |

### `settlements`
| Champ | Type | Contraintes | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Identifiant unique |
| `group_order_id` | INTEGER | FK `group_orders.id` (SET NULL) | Commande facultativement liée |
| `payer_id` | INTEGER | FK `members.id` (CASCADE) | Membre qui rembourse (débiteur) |
| `receiver_id` | INTEGER | FK `members.id` (CASCADE) | Membre qui reçoit (créancier) |
| `amount` | REAL | NOT NULL | Montant remboursé (€) |
| `payment_method` | TEXT | NOT NULL DEFAULT 'WERO' | `WERO`, `VIREMENT`, `PAYPAL`, `ESPECES`, `LYDIA`, `AUTRE` |
| `settled_at` | TEXT | NOT NULL | Date de la transaction (YYYY-MM-DD) |
| `notes` | TEXT | NULLABLE | Notes ou libellé de virement |
| `created_at` | TEXT | NOT NULL | Timestamp ISO |

---

## 4. Logique Financière & Algorithme des Soldes

L'ensemble des calculs réside dans le handler Nitro `server/api/balances.get.ts` :

### Règle d'Imputation des Dépenses & Cadeaux
Pour chaque besoin de filament dans une commande :
- **Payeur effectif** : `debtorId = payer_member_id || member_id`.
- Si un article est offert ou pris en charge (`payer_member_id` non nul), la charge financière de la bobine et de ses frais de port associés est imputée au payeur désigné. Le destinataire réel (`member_id`) voit son solde net impacté de 0 € pour cette ligne.
- **Répartition des frais de port** :
  - **Pro rata** : La valeur de l'article offert est comptabilisée dans l'assiette du payeur effectif.
  - **Équitable (parts égales)** : Tout membre payeur (y compris s'il ne commande rien pour lui-même mais paie pour un ami) compte comme participant payeur à part entière dans la division des frais.

### Formule du Solde Net Individuel
Pour chaque membre $M$ :
$$
\text{Solde Net}_M = \left( \sum \text{Avancé}_M - \sum \text{Consommé}_M \right) + \sum \text{Remb. Versés}_M - \sum \text{Remb. Reçus}_M
$$

- $\text{Avancé}_M$ : somme des `total_amount` des commandes où $M$ est `buyer_id`.
- $\text{Consommé}_M$ : somme du coût des bobines où $M$ est payeur effectif passées dans une commande + quote-part des frais de port (`EQUITABLE` : frais divisés par nombre de participants payeurs ; `PRORATA` : frais au prorata de la valeur des filaments pris en charge par le membre).
- $\text{Remb. Versés}_M$ : somme des virements où $M$ est `payer_id`.
- $\text{Remb. Reçus}_M$ : somme des virements où $M$ est `receiver_id`.

### Algorithme de Simplification de Dettes ("Qui doit quoi à qui")
1. Filtrer les membres créanciers ($\text{Solde Net} > +0.01\ \text{€}$) et débiteurs ($\text{Solde Net} < -0.01\ \text{€}$).
2. Trier les créanciers par montant décroissant et débiteurs par dette décroissante.
3. Apparier gloutonnement le plus gros débiteur avec le plus gros créancier avec $\min(\text{Dette Restante}, \text{Créance Restante})$.
4. Répéter jusqu'à équilibre complet de tous les comptes.

---

## 5. Déploiement Docker & Coolify

### Spécificités Alpine
- **Builder Stage** : `apk add --no-cache python3 make g++` est obligatoire pour la compilation native de `better-sqlite3`. Le lockfile npm est synchronisé via `npm i -g npm@latest && npm ci`.
- **Runner Stage** : `apk add --no-cache curl libstdc++` est nécessaire pour exécuter le binaire C++ `better-sqlite3` sur Alpine musl sans dépendance manquante.
- L'application tourne sous l'utilisateur non-root `node`.
- Le volume persistant doit être monté sur `/app/data`.

---

## 6. Commandes Usuelles & Makefile

### Commandes Makefile
```bash
# Lancer le serveur de développement
make dev

# Initialiser ou vérifier les tables SQLite locales
make db:migrate

# Réinitialiser la base locale à zéro (suppression du fichier .db + migration)
make db:reset

# Vider toutes les tables sans supprimer le fichier .db
make seed:clean

# Injecter un jeu minimaliste (3 membres, 0 besoin, 0 commande)
make seed:minimal

# Injecter des membres et des besoins variés en attente de regroupement
make seed:pending

# Injecter le jeu d'essai exhaustif (commandes équitable/prorata, soldes, virements Wero)
make seed:full
```

### Autres commandes npm & Docker
```bash
# Vérifier la compilation et le typage
npm run build

# Tester l'image Docker en local
docker build -t bambulab-order-tracking .
docker run --rm -p 3000:3000 bambulab-order-tracking
```
