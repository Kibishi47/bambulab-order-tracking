<script setup lang="ts">
import { ref } from 'vue'
import {
  Coffee,
  ShoppingBag,
  CreditCard,
  Layers,
  Truck,
  PackageCheck,
  CheckCircle2,
  ArrowRight,
  PauseCircle,
  Sparkles,
  ShieldCheck,
  Zap,
  TrendingDown,
  Gift,
  HelpCircle,
  Info
} from 'lucide-vue-next'

useHead({
  title: 'Comment ça marche ? - BambuShare',
  meta: [
    { name: 'description', content: 'Guide visuel et interactif pour comprendre le fonctionnement des commandes groupées, des statuts et des remboursements.' }
  ]
})

// Profil sélectionné
type ProfileType = 'tranquille' | 'organisateur' | 'payeur'
const activeProfile = ref<ProfileType>('tranquille')

const profiles = [
  {
    id: 'tranquille' as ProfileType,
    badge: 'Membre demandeur',
    title: 'J\'ai juste besoin de bobines',
    subtitle: 'Mode tranquille',
    icon: Coffee,
    color: 'text-emerald-600 dark:text-emerald-400',
    borderColor: 'border-emerald-500',
    bgColor: 'bg-emerald-50 dark:bg-emerald-500/10',
    steps: [
      {
        num: '01',
        title: 'J\'ajoute mes besoins au fil de l\'eau',
        desc: 'Matière, couleur, format recharge ou avec bobine : j\'enregistre mes envies dès que j\'en ai besoin.'
      },
      {
        num: '02',
        title: 'Option budget serré : « En pause »',
        desc: 'Si je n\'ai pas le budget tout de suite, j\'active le toggle « En pause » pour mémoriser la référence sans risquer qu\'un ami la commande à ma place.'
      },
      {
        num: '03',
        title: 'Commande & Suivi automatique',
        desc: 'Dès qu\'un pote prépare une commande groupée, il coche ma bobine. Je la vois passer automatiquement à « Commandé » puis « Reçu ».'
      }
    ]
  },
  {
    id: 'organisateur' as ProfileType,
    badge: 'Acheteur',
    title: 'Je passe une commande groupée',
    subtitle: 'Mode organisateur',
    icon: ShoppingBag,
    color: 'text-blue-600 dark:text-blue-400',
    borderColor: 'border-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-500/10',
    steps: [
      {
        num: '01',
        title: 'Je rassemble les besoins en attente',
        desc: 'J\'atteins les paliers de remises Bambu Lab (4+ bobines) et le seuil de livraison gratuite (≥ 55 €) pour optimiser les prix de tout le monde.'
      },
      {
        num: '02',
        title: 'J\'avance les fonds sur le store officiel',
        desc: 'Je règle l\'intégralité du panier avec ma carte bancaire et j\'enregistre le numéro de commande #FR dans l\'application.'
      },
      {
        num: '03',
        title: 'Réception & Actions en cascade',
        desc: 'À la livraison du carton, un clic sur « Marquer comme reçue » met à jour d\'un coup tous les besoins des amis vers « Reçu ».'
      },
      {
        num: '04',
        title: 'Distribution conviviale',
        desc: 'Remise en main propre lors de la prochaine session print ou apéro, puis passage en « Distribué ».'
      }
    ]
  },
  {
    id: 'payeur' as ProfileType,
    badge: 'Remboursements',
    title: 'Je règle mes dettes sans prise de tête',
    subtitle: 'Mode bon payeur',
    icon: CreditCard,
    color: 'text-amber-600 dark:text-amber-400',
    borderColor: 'border-amber-500',
    bgColor: 'bg-amber-50 dark:bg-amber-500/10',
    steps: [
      {
        num: '01',
        title: 'Je consulte « Qui doit quoi à qui »',
        desc: 'L\'algorithme simplifie tous les virements croisés pour qu\'il n\'y ait que le strict minimum de transactions à effectuer.'
      },
      {
        num: '02',
        title: 'J\'envoie le montant par Wero ou virement',
        desc: 'Règlement instantané de compte bancaire à compte bancaire, sans commission ni intermédiaire.'
      },
      {
        num: '03',
        title: 'J\'enregistre le règlement',
        desc: 'Un clic sur « Nouveau règlement » remet les compteurs nets à 0.00 € pour les deux membres.'
      }
    ]
  }
]

// Stepper interactif des statuts
const selectedStep = ref<number>(0)
const stepsCycle = [
  {
    id: 'DEMANDE',
    label: 'Demandé',
    badgeClass: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700',
    icon: Layers,
    summary: 'Le besoin est exprimé par un membre et attend d\'être regroupé.',
    action: 'Visible par tous les membres qui préparent une commande. Peut être mis en pause si vous n\'avez pas le budget immédiatement.'
  },
  {
    id: 'COMMANDE',
    label: 'Commandé',
    badgeClass: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800/40',
    icon: ShoppingBag,
    summary: 'La bobine a été payée sur le store Bambu Lab par l\'acheteur.',
    action: 'L\'acheteur avance les fonds. La quote-part de la bobine et des frais de port commence à être comptabilisée dans les soldes.'
  },
  {
    id: 'RECU',
    label: 'Reçu',
    badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800/40',
    icon: Truck,
    summary: 'Le colis est arrivé chez l\'acheteur ou au lieu de dépôt.',
    action: 'L\'acheteur utilise l\'action rapide en cascade pour basculer tous les articles de la commande en « Reçu » dès l\'ouverture du colis.'
  },
  {
    id: 'DISTRIBUE',
    label: 'Distribué',
    badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40',
    icon: PackageCheck,
    summary: 'La bobine est entre les mains de son propriétaire final.',
    action: 'Fin de cycle pour cet article. La bobine est prête à imprimer sur votre Bambu Lab !'
  }
]
</script>

<template>
  <div class="space-y-10 max-w-5xl mx-auto pb-12">
    <!-- Hero Header -->
    <div class="text-center space-y-3 pt-4">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-bambu-50 text-bambu-700 dark:bg-bambu-500/10 dark:text-bambu-400 border border-bambu-200 dark:border-bambu-500/30">
        <Sparkles class="w-3.5 h-3.5" />
        <span>Workflow & Fonctionnement</span>
      </div>
      <h1 class="text-2xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
        Comment fonctionne BambuShare ?
      </h1>
      <p class="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
        Optimisez vos achats de filaments, atteignez les réductions quantitatives et remboursez l'acheteur en toute transparence sans calculs compliqués.
      </p>
    </div>

    <!-- 1. Sélecteur de profil interactif (Bento) -->
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-base font-bold text-zinc-900 dark:text-white">
            1. Choisissez votre rôle
          </h2>
          <p class="text-xs text-zinc-500 dark:text-zinc-400">
            Cliquez sur un profil pour visualiser son parcours pas à pas.
          </p>
        </div>
      </div>

      <!-- Onglets Bento -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <button
          v-for="p in profiles"
          :key="p.id"
          type="button"
          class="p-4 rounded-xl border text-left transition-all relative overflow-hidden"
          :class="[
            activeProfile === p.id
              ? 'bg-white dark:bg-zinc-900 shadow-md border-bambu-500 ring-2 ring-bambu-500/20'
              : 'bg-zinc-50/70 hover:bg-zinc-100/70 dark:bg-zinc-900/40 dark:hover:bg-zinc-800/40 border-zinc-200 dark:border-zinc-800'
          ]"
          @click="activeProfile = p.id"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="p-2.5 rounded-lg" :class="p.bgColor">
              <component :is="p.icon" class="w-5 h-5" :class="p.color" />
            </div>
            <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
              {{ p.subtitle }}
            </span>
          </div>

          <div class="mt-3">
            <h3 class="text-sm font-bold text-zinc-900 dark:text-white">
              {{ p.title }}
            </h3>
            <span class="text-xs text-zinc-500 dark:text-zinc-400">
              {{ p.badge }}
            </span>
          </div>
        </button>
      </div>

      <!-- Détail interactif du rôle actif -->
      <div
        v-for="p in profiles"
        :key="p.id"
        v-show="activeProfile === p.id"
        class="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 shadow-sm space-y-6 animate-fadeIn"
      >
        <div class="flex items-center gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div class="p-2.5 rounded-xl" :class="p.bgColor">
            <component :is="p.icon" class="w-6 h-6" :class="p.color" />
          </div>
          <div>
            <h3 class="text-lg font-bold text-zinc-900 dark:text-white">
              {{ p.title }}
            </h3>
            <p class="text-xs text-zinc-500 dark:text-zinc-400">
              Les étapes clés pour ce mode d'utilisation.
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="step in p.steps"
            :key="step.num"
            class="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80 space-y-2 relative"
          >
            <span class="text-xl font-black font-mono text-zinc-300 dark:text-zinc-700 block">
              {{ step.num }}
            </span>
            <h4 class="text-xs font-bold text-zinc-900 dark:text-white">
              {{ step.title }}
            </h4>
            <p class="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {{ step.desc }}
            </p>
          </div>
        </div>

        <!-- Highlight spécifique selon le mode -->
        <div v-if="p.id === 'tranquille'" class="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
          <PauseCircle class="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div class="text-xs space-y-1">
            <p class="font-bold text-amber-900 dark:text-amber-300">
              Astuce budget : Vous repérez une couleur mais ne pouvez pas l'acheter ce mois-ci ?
            </p>
            <p class="text-amber-800 dark:text-amber-400">
              Cochez l'interrupteur <strong>« Mettre en pause »</strong> lors de l'ajout. Votre besoin reste noté dans votre liste pour plus tard, mais aucun ami ne pourra l'inclure dans un panier tant que vous ne l'aurez pas réactivé.
            </p>
          </div>
        </div>

        <div v-if="p.id === 'organisateur'" class="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-3">
          <Zap class="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div class="text-xs space-y-1">
            <p class="font-bold text-blue-900 dark:text-blue-300">
              Gain de temps : Les actions en cascade à l'arrivée du colis
            </p>
            <p class="text-blue-800 dark:text-blue-400">
              Inutile de modifier le statut de chaque bobine une par une. Sur la page de la commande, le bouton <strong>« Marquer comme reçue »</strong> applique automatiquement le statut à toutes les bobines associées dans une transaction sécurisée.
            </p>
          </div>
        </div>

        <div v-if="p.id === 'payeur'" class="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
          <ShieldCheck class="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div class="text-xs space-y-1">
            <p class="font-bold text-emerald-900 dark:text-emerald-300">
              Zéro prise de tête : La compensation intelligente des dettes
            </p>
            <p class="text-emerald-800 dark:text-emerald-400">
              Si Thomas doit 15 € à Sophie et Sophie doit 20 € à Thomas, le système réduit cela à un unique virement de 5 € de Sophie à Thomas. Un clic sur <strong>« Rembourser »</strong> préremplit le formulaire.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 2. Stepper interactif horizontal du cycle de vie -->
    <div class="space-y-4">
      <div>
        <h2 class="text-base font-bold text-zinc-900 dark:text-white">
          2. Le cycle de vie d'une bobine
        </h2>
        <p class="text-xs text-zinc-500 dark:text-zinc-400">
          Chaque filament traverse 4 statuts bien définis. Cliquez sur une étape pour comprendre son rôle.
        </p>
      </div>

      <div class="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 shadow-sm space-y-6">
        <!-- Barre de progression Stepper -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 relative">
          <button
            v-for="(st, idx) in stepsCycle"
            :key="st.id"
            type="button"
            class="p-3.5 rounded-xl border text-left transition-all relative cursor-pointer"
            :class="[
              selectedStep === idx
                ? 'bg-bambu-50 dark:bg-bambu-500/15 border-bambu-500 ring-2 ring-bambu-500/20'
                : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
            ]"
            @click="selectedStep = idx"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-mono font-bold text-zinc-400">0{{ idx + 1 }}</span>
              <component
                :is="st.icon"
                class="w-4 h-4"
                :class="selectedStep === idx ? 'text-bambu-600 dark:text-bambu-400' : 'text-zinc-400'"
              />
            </div>
            <span class="text-xs font-bold text-zinc-900 dark:text-white block truncate">
              {{ st.label }}
            </span>
          </button>
        </div>

        <!-- Détail de l'étape sélectionnée -->
        <div class="p-4 sm:p-5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                Statut :
              </span>
              <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full border" :class="stepsCycle[selectedStep].badgeClass">
                {{ stepsCycle[selectedStep].label }}
              </span>
            </div>
            <p class="text-xs font-semibold text-zinc-800 dark:text-zinc-200 pt-1">
              {{ stepsCycle[selectedStep].summary }}
            </p>
            <p class="text-xs text-zinc-500 dark:text-zinc-400">
              {{ stepsCycle[selectedStep].action }}
            </p>
          </div>

          <div class="flex items-center gap-2 text-xs font-semibold text-bambu-600 dark:text-bambu-400 shrink-0">
            <span>Étape {{ selectedStep + 1 }} sur 4</span>
            <ArrowRight class="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>

    <!-- 3. Les 3 règles d'or du groupe -->
    <div class="space-y-4">
      <div>
        <h2 class="text-base font-bold text-zinc-900 dark:text-white">
          3. Les 3 règles d'or du groupe
        </h2>
        <p class="text-xs text-zinc-500 dark:text-zinc-400">
          Pour des commandes groupées fluides et une trésorerie toujours saine entre amis.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Règle 1 -->
        <div class="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm space-y-3">
          <div class="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 flex items-center justify-center text-lg">
            🎯
          </div>
          <h3 class="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white">
            Optimisation des paliers
          </h3>
          <p class="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Avant de valider votre panier Bambu Lab, vérifiez si un ami a un besoin en attente. Le store applique des remises significatives dès <strong>4 bobines</strong> et les frais de port sont <strong>offerts dès 55 €</strong>.
          </p>
        </div>

        <!-- Règle 2 -->
        <div class="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm space-y-3">
          <div class="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 flex items-center justify-center text-lg">
            📦
          </div>
          <h3 class="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white">
            Transparence sur le port
          </h3>
          <p class="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Si des frais de port s'appliquent, l'application propose deux modes au choix : <strong>Équitable</strong> (parts égales entre chaque participant) ou <strong>Au pro rata</strong> (proportionnel à la valeur de chaque commande).
          </p>
        </div>

        <!-- Règle 3 -->
        <div class="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm space-y-3">
          <div class="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 flex items-center justify-center text-lg">
            ⚡
          </div>
          <h3 class="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white">
            Règlements rapides
          </h3>
          <p class="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            L'acheteur avance la trésorerie pour tout le monde. Dès que la commande groupée est confirmée, effectuez votre virement Wero sans attendre la réception du colis pour ne pas le pénaliser.
          </p>
        </div>
      </div>
    </div>

    <!-- Call to action bar -->
    <div class="p-6 rounded-2xl bg-gradient-to-r from-bambu-500/10 via-bambu-500/5 to-transparent border border-bambu-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div>
        <h3 class="text-sm font-bold text-zinc-900 dark:text-white">
          Prêt à exprimer un besoin ?
        </h3>
        <p class="text-xs text-zinc-600 dark:text-zinc-400">
          Ajoutez vos bobines en quelques clics ou consultez les commandes en cours.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <NuxtLink
          to="/besoins"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-bambu-500 hover:bg-bambu-600 text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
        >
          <Layers class="w-4 h-4" />
          <span>Voir les besoins</span>
        </NuxtLink>
        <NuxtLink
          to="/"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold transition-all"
        >
          <span>Tableau de bord</span>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.2s ease-out;
}
</style>
