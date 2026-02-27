/**
 * Service de conversion des prix LTC en EUR
 * Récupère le taux de change en temps réel via une API publique
 */

let ltcToEurRate: number | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Récupère le taux de change LTC/EUR actuel
 */
export async function getLTCToEURRate(): Promise<number> {
  const now = Date.now();
  
  // Retourner le cache s'il est valide
  if (ltcToEurRate !== null && (now - lastFetchTime) < CACHE_DURATION) {
    return ltcToEurRate;
  }

  try {
    // Utiliser CoinGecko API (gratuite, pas de clé requise)
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=litecoin&vs_currencies=eur'
    );
    
    if (!response.ok) throw new Error('Failed to fetch LTC price');
    
    const data = await response.json();
    ltcToEurRate = data.litecoin.eur;
    lastFetchTime = now;
    
    return ltcToEurRate;
  } catch (error) {
    console.error('Error fetching LTC/EUR rate:', error);
    // Retourner un taux par défaut en cas d'erreur
    // Approximation : 1 LTC ≈ 120-150 EUR (à adapter selon le marché)
    return 130;
  }
}

/**
 * Convertit un montant en LTC en EUR
 */
export async function convertLTCToEUR(ltcAmount: number): Promise<number> {
  const rate = await getLTCToEURRate();
  return ltcAmount * rate;
}

/**
 * Formate un prix en EUR
 */
export function formatEUR(amount: number): string {
  return `€${amount.toFixed(2)}`;
}

/**
 * Formate un prix en LTC
 */
export function formatLTC(amount: number): string {
  return `${amount.toFixed(8)} LTC`;
}

/**
 * Obtient le taux de change en cache (synchrone)
 * Retourne null si le cache est vide
 */
export function getCachedLTCRate(): number | null {
  return ltcToEurRate;
}

/**
 * Réinitialise le cache (utile pour les tests)
 */
export function resetCache(): void {
  ltcToEurRate = null;
  lastFetchTime = 0;
}
