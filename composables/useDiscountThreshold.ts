/**
 * Seuil optimal de commande groupée Bambu Lab.
 * Le store officiel Bambu Lab applique des remises quantitatives progressives (dès 4 bobines, puis jusqu'à 10 bobines).
 * Au-delà de 10 bobines, la réduction unitaire maximale est atteinte : il n'y a plus de remise supplémentaire.
 * Cette constante sert d'indicateur centralisé qu'il est temps de commander pour maximiser les économies du groupe.
 */
export const DISCOUNT_THRESHOLD = 10
