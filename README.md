# BambuShare 🧵 • Suivi des Commandes Groupées Bambu Lab

> Application web moderne, minimaliste et autonome conçue pour centraliser les besoins et gérer les commandes groupées de filaments 3D (Bambu Lab) d'un groupe d'amis, avec calcul automatique des soldes et simplification des remboursements ("Qui doit quoi à qui").

---

## ✨ Fonctionnalités Clés

1. **👥 Annuaire des membres** :
   - CRUD complet des amis participant aux commandes groupées.
   - Suivi des coordonnées (email, téléphone, adresse/lieu de remise habituel).
   - Soldes nets et statistiques individuelles en temps réel.

2. **🧵 Gestion continue des besoins (au fil de l'eau)** :
   - Ajout rapide d'un besoin : type de filament (PLA Basic, PLA Matte, PETG HF, TPU 95A, ABS, PETG-CF, etc.), conditionnement (Recharge éco vs Bobine complète), couleur avec palette officielle Bambu Lab ou sélecteur personnalisé, quantité, prix estimé.
   - Cycle de vie complet : `DEMANDE` ➔ `PRIS_EN_CHARGE` ➔ `COMMANDE` ➔ `RECU` ➔ `DISTRIBUE` (avec possibilité d'annuler ou supprimer).
   - Filtres dynamiques par statut, membre demandeur, matière de filament et recherche textuelle.
   - Indicateur visuel du seuil de commande avantageux (dès 4 bobines en attente).

3. **📦 Commandes groupées & Avance des fonds** :
   - Sélection assistée des besoins en attente pour créer le panier Bambu Lab.
   - Désignation du membre acheteur qui avance les fonds.
   - Renseignement du montant réel facturé, de la date d'achat, des frais de port et du numéro de commande (#FR...).
   - Ventilation claire des coûts par membre dans la fiche commande.

4. **⚖️ Calcul des soldes & Remboursements ("Qui doit quoi à qui")** :
   - Algorithme de calcul du solde net de chaque membre : $(\text{Total avancé}) - (\text{Total consommé}) + (\text{Remboursements versés}) - (\text{Remboursements reçus})$.
   - **Algorithme de simplification des dettes** : Minimise les flux de paiement et indique directement qui doit virer combien à qui (ex : *Lucas doit 33,98 € à Thomas*).
   - Bouton d'action en 1 clic pour pré-remplir et enregistrer un remboursement (Lydia, PayPal, virement bancaire, espèces).
   - Historique complet et transparent de tous les règlements.

---

## 🛠 Stack Technique (Politique Zéro Bloat)

- **Framework** : [Nuxt 3](https://nuxt.com/) (Vue 3 Composition API + routes d'API Nitro serveur).
- **Base de Données** : [SQLite](https://www.sqlite.org/) local avec [Drizzle ORM](https://orm.drizzle.team/) et `better-sqlite3`.
- **Design & UI** : [Tailwind CSS](https://tailwindcss.com/) inspiré de l'identité visuelle Bambu Lab (vert `#00AE42`, gris zinc sombre `#0c0d10`, bordures nettes `border-zinc-800`, badges de matières et pastilles de teintes réelles).
- **Icônes** : `lucide-vue-next`.
- **Persistance & Déploiement** : Docker multi-stage Alpine optimisé + `docker-compose.yml` prêt pour [Coolify](https://coolify.io/).

---

## 🚀 Démarrage Rapide en Local

### Prérequis
- Node.js 20+ ou 22+
- npm (ou pnpm)

### Installation
```bash
# Cloner le dépôt
git clone <repo-url>
cd bambulab-order-tracking

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

L'application est accessible sur [http://localhost:3000](http://localhost:3000).

> **Note :** Au premier lancement, la base de données SQLite est automatiquement initialisée dans `./data/bambulab.db` et pré-alimentée avec des données de démonstration réalistes (membres, commandes et besoins).

### Build de Production Local
```bash
npm run build
npm run preview
```

---

## 🐳 Déploiement avec Docker & Coolify

L'application est livrée avec une configuration multi-stage ultra-légère basée sur `node:22-alpine` et configurée pour un utilisateur non-root (`node`).

### Déploiement via Docker Compose
```bash
docker compose up -d --build
```

### Déploiement sur Coolify
1. Sur votre instance Coolify, créez une nouvelle ressource : **Application** ➔ **Public Repository** (ou Private).
2. Type de build : **Docker Compose** (sélectionner `docker-compose.yml`) ou **Dockerfile**.
3. Assurez-vous que le volume persistant est configuré pour monter le dossier `/app/data` :
   - Volume : `bambulab_data:/app/data` (ou `./data:/app/data`).
4. Port exposé : `3000`.
5. Healthcheck : `/api/health` (configuré automatiquement dans le `Dockerfile`).
6. Vos données SQLite sont 100 % persistées lors de chaque mise à jour ou redémarrage du conteneur.

---

## 📂 Structure du Projet

```
bambulab-order-tracking/
├── server/
│   ├── api/
│   │   ├── health.get.ts        # Endpoint santé pour Coolify
│   │   ├── members/             # CRUD membres
│   │   ├── demands/             # CRUD besoins filaments & statuts
│   │   ├── orders/              # CRUD commandes groupées & ventilation
│   │   ├── settlements/         # CRUD remboursements
│   │   └── balances.get.ts      # Calcul des soldes & simplification des dettes
│   ├── database/
│   │   ├── schema.ts            # Schéma Drizzle ORM (SQLite)
│   │   └── index.ts             # Connexion better-sqlite3 & auto-migration
│   └── plugins/
│       └── db.ts                # Initialisation Nitro au boot
├── pages/
│   ├── index.vue                # Tableau de bord, alertes seuil & dettes
│   ├── besoins.vue              # Suivi des besoins, cycle de vie & filtres
│   ├── commandes/
│   │   ├── index.vue            # Liste des commandes groupées
│   │   └── [id].vue             # Fiche commande détaillée & ventilation acheteur
│   ├── reglements.vue           # Soldes nets, "Qui doit quoi à qui", règlements
│   └── membres.vue              # Annuaire des membres & coordonnées
├── components/
│   ├── AppHeader.vue            # En-tête de navigation Bambu Lab
│   ├── BadgeFilament.vue        # Badge matière, format recharge/bobine & couleur
│   ├── StatusBadge.vue          # Pastilles d'état du cycle de vie
│   ├── StatCard.vue             # KPI metrics card
│   ├── Modal.vue                # Modale accessible réutilisable
│   ├── demands/DemandModal.vue  # Formulaire création besoin filament
│   ├── members/MemberModal.vue  # Formulaire création / édition membre
│   ├── orders/OrderModal.vue    # Formulaire création commande groupée
│   └── settlements/SettlementModal.vue # Formulaire enregistrement virement
├── Dockerfile                   # Build multi-stage Alpine optimisé
├── docker-compose.yml           # Configuration prête pour Coolify
├── drizzle.config.ts            # Config Drizzle Kit
└── nuxt.config.ts               # Configuration Nuxt 3 & Tailwind
```

---

## 📜 Licence
MIT
