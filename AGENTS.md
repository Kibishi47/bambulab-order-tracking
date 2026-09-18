# Spécifications & Guide d'Intervention pour Agents IA (`AGENTS.md`)

Ce document détaille l'architecture globale, les conventions techniques et les règles métier de l'application **BambuShare** pour toute future intervention d'un agent d'intelligence artificielle ou développeur.

---

## 1. Vue d'Ensemble & Objectifs Métier

L'application permet à un groupe d'amis d'optimiser leurs commandes de filaments sur le store officiel **Bambu Lab** :
- **Commandes groupées** : Atteindre les seuils de frais de port gratuits (>= 55 €) et les remises quantitatives (>= 4 bobines).
- **Avance de trésorerie** : Un seul membre (l'acheteur) passe la commande et paye l'intégralité du panier.
- **Cycle de vie des besoins** : Suivi fin de chaque bobine, de la demande initiale jusqu'à la remise en mains propres.
- **Remboursements simplifiés ("Qui doit quoi à qui")** : Minimisation du nombre de virements nécessaires pour solder tous les comptes grâce à un algorithme glouton de compensation de dettes.

---

## 2. Architecture Technique

### 2.1 Stack Fondamentale
- **Framework** : Nuxt 3 (Fullstack Vue 3 Composition API + routes d'API Nitro sous `server/api/`).
- **Base de données** : SQLite local avec `better-sqlite3` et `drizzle-orm`.
  - Mode journal : `WAL` (`sqlite.pragma('journal_mode = WAL')`).
  - Clés étrangères actives : `sqlite.pragma('foreign_keys = ON')`.
  - Emplacement par défaut : `data/bambulab.db` (surchargeable via `DATABASE_PATH`).
- **Auto-migration & Boot** : `server/plugins/db.ts` initialise les tables SQLite à chaque démarrage de l'application via `CREATE TABLE IF NOT EXISTS` et applique un jeu de données de test si la base est vide.
- **UI / CSS** : Tailwind CSS avec la charte officielle Bambu Lab :
  - Vert accent : `bambu-500` (`#00AE42`), `bambu-600` (`#009a3a`).
  - Arrière-plan : `bg-[#0c0d10]`, cartes `bg-[#14161a]`, bordures `border-zinc-800`.
- **Icônes** : `lucide-vue-next` (import direct par composant).
- **Dépendances** : Politique stricte zéro bloat. Ne pas introduire d'ORM lourd (interdiction d'utiliser Prisma) ni de frameworks UI surdimensionnés.

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
| `notes` | TEXT | NULLABLE | Suivi colis, transporteur, etc. |
| `created_at` | TEXT | NOT NULL | Timestamp ISO |

### `filament_demands`
| Champ | Type | Contraintes | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Identifiant unique |
| `member_id` | INTEGER | FK `members.id` (CASCADE) | Membre demandeur |
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
| `payment_method` | TEXT | NOT NULL | `LYDIA`, `PAYPAL`, `VIREMENT`, `ESPECES`, `AUTRE` |
| `settled_at` | TEXT | NOT NULL | Date de la transaction (YYYY-MM-DD) |
| `notes` | TEXT | NULLABLE | Notes ou libellé de virement |
| `created_at` | TEXT | NOT NULL | Timestamp ISO |

---

## 4. Logique Financière & Algorithme des Soldes

L'ensemble des calculs réside dans le handler Nitro `server/api/balances.get.ts` :

### Formule du Solde Net Individuel
Pour chaque membre $M$ :
$$
\text{Solde Net}_M = \left( \sum \text{Avancé}_M - \sum \text{Consommé}_M \right) + \sum \text{Remb. Versés}_M - \sum \text{Remb. Reçus}_M
$$

- $\text{Avancé}_M$ : somme des `total_amount` des commandes où $M$ est `buyer_id`.
- $\text{Consommé}_M$ : somme de $(\text{quantité} \times \text{prix})$ des besoins de $M$ passés dans une commande (`COMMANDE`, `RECU`, `DISTRIBUE`).
- $\text{Remb. Versés}_M$ : somme des virements où $M$ est `payer_id`.
- $\text{Remb. Reçus}_M$ : somme des virements où $M$ est `receiver_id`.

**Interprétation :**
- $\text{Solde Net} > +0.01\ \text{€}$ : $M$ est **Créancier** (on doit lui rembourser de l'argent).
- $\text{Solde Net} < -0.01\ \text{€}$ : $M$ est **Débiteur** (il doit de l'argent au groupe).
- Autour de $0\ \text{€}$ : $M$ est **À jour**.

### Algorithme de Simplification de Dettes ("Qui doit quoi à qui")
1. Filtrer les membres ayant un solde strictement positif ($\text{Créanciers}$) et ceux ayant un solde strictement négatif ($\text{Débiteurs}$).
2. Trier les créanciers par montant décroissant.
3. Trier les débiteurs par valeur absolue décroissante.
4. Effectuer un appariement glouton :
   - Associer le plus gros débiteur au plus gros créancier.
   - Montant de la transaction = $\min(\text{Dette Restante}, \text{Créance Restante})$.
   - Enregistrer la transaction simplifiée : `{ from: Débiteur, to: Créancier, amount: Montant }`.
   - Décrémenter les soldes restants et avancer les pointeurs.
   - Répéter jusqu'à ce que tous les comptes soient soldés.

---

## 5. Conventions de Code & Rigueur

### 5.1 Commits Git (Conventional Commits)
Tout ajout de code ou refactoring doit être commité avec des messages clairs et atomiques :
- `feat(...)` : nouvelle fonctionnalité
- `fix(...)` : correction d'un bug
- `refactor(...)` : amélioration de structure sans impact fonctionnel
- `chore(...)` : maintenance, configuration, dépendances
- `docs(...)` : documentation (`README.md`, `AGENTS.md`)

### 5.2 TypeScript & Typage Strict
- Ne pas utiliser `any` sans justification explicite.
- Utiliser les types inférés de Drizzle (`typeof members.$inferSelect`, `typeof filamentDemands.$inferInsert`).

### 5.3 Sécurité & Persistance Coolify
- Ne jamais coder en dur le chemin de la base SQLite. Toujours utiliser `process.env.DATABASE_PATH || './data/bambulab.db'`.
- Le conteneur Docker tourne sous l'utilisateur non-root `node`. Les dossiers créés doivent disposer des permissions adéquates (`chown -R node:node /app`).

---

## 6. Commandes Usuelles

```bash
# Lancer le serveur de développement
npm run dev

# Vérifier la compilation et le typage
npx nuxt build

# Générer les types Nuxt
npx nuxi prepare

# Lancer la production en conteneur Docker
docker compose up -d --build
```
