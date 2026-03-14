// Produits avec support multi-prix (PayPal, LTC, Paysafecard)

const SUPABASE_URL = "https://eqzcmxtrkgmcjhvbnefq.supabase.co";
const SUPABASE_KEY = "sb_publishable_efQGrrNRPLO7uLmKqsA5Jw_uyGx5Cc7";

// Normalise les prix en numbers pour éviter les bugs d'affichage côté client
function normalizeProducts(products: any[]): any[] {
  return products.map(p => ({
    ...p,
    pricePayPal: parseFloat(p.pricePayPal) || 0,
    priceLTC: parseFloat(p.priceLTC) || 0,
    pricePSC: parseFloat(p.pricePSC) || 0,
    stock: parseInt(p.stock) || 0,
  }));
}


export const DEFAULT_PRODUCTS = [
  {"id":"acc-2025-account","columnId":"Accounts","nameKey":"prod_acc_2025_account_name","descKey":"prod_acc_2025_account_desc","pricePayPal":1.00,"priceLTC":0.00012,"pricePSC":1.00,"image":"https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60","stock":29},
  {"id":"acc-2024-account","columnId":"Accounts","nameKey":"prod_acc_2024_account_name","descKey":"prod_acc_2024_account_desc","pricePayPal":1.50,"priceLTC":0.00018,"pricePSC":2.00,"image":"https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60","stock":29},
  {"id":"acc-2023-account","columnId":"Accounts","nameKey":"prod_acc_2023_account_name","descKey":"prod_acc_2023_account_desc","pricePayPal":1.10,"priceLTC":0.00013,"pricePSC":1.50,"image":"https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60","stock":29},
  {"id":"acc-2022-account","columnId":"Accounts","nameKey":"prod_acc_2022_account_name","descKey":"prod_acc_2022_account_desc","pricePayPal":1.50,"priceLTC":0.00018,"pricePSC":2.00,"image":"https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60","stock":29},
  {"id":"acc-2021-account","columnId":"Accounts","nameKey":"prod_acc_2021_account_name","descKey":"prod_acc_2021_account_desc","pricePayPal":2.00,"priceLTC":0.00024,"pricePSC":2.50,"image":"https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60","stock":29},
  {"id":"acc-2020-account","columnId":"Accounts","nameKey":"prod_acc_2020_account_name","descKey":"prod_acc_2020_account_desc","pricePayPal":2.45,"priceLTC":0.00029,"pricePSC":3.00,"image":"https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60","stock":29},
  {"id":"acc-2019-account","columnId":"Accounts","nameKey":"prod_acc_2019_account_name","descKey":"prod_acc_2019_account_desc","pricePayPal":3.25,"priceLTC":0.00039,"pricePSC":4.00,"image":"https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60","stock":29},
  {"id":"acc-2018-account","columnId":"Accounts","nameKey":"prod_acc_2018_account_name","descKey":"prod_acc_2018_account_desc","pricePayPal":3.90,"priceLTC":0.00047,"pricePSC":5.00,"image":"https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60","stock":29},
  {"id":"acc-2017-account","columnId":"Accounts","nameKey":"prod_acc_2017_account_name","descKey":"prod_acc_2017_account_desc","pricePayPal":4.90,"priceLTC":0.00059,"pricePSC":6.00,"image":"https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60","stock":29},
  {"id":"acc-2016-account","columnId":"Accounts","nameKey":"prod_acc_2016_account_name","descKey":"prod_acc_2016_account_desc","pricePayPal":10.00,"priceLTC":0.00120,"pricePSC":10.00,"image":"https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60","stock":29},
  {"id":"acc-2015-account","columnId":"Accounts","nameKey":"prod_acc_2015_account_name","descKey":"prod_acc_2015_account_desc","pricePayPal":53.00,"priceLTC":0.00636,"pricePSC":53.00,"image":"https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60","stock":29},
  {"id":"social-netflix-no-ads","columnId":"Social","nameKey":"prod_social_netflix_no_ads_name","descKey":"prod_social_netflix_no_ads_desc","pricePayPal":2.35,"priceLTC":0.00028,"pricePSC":2.50,"image":"https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60","stock":29},
  {"id":"social-netflix-4k","columnId":"Social","nameKey":"prod_social_netflix_4k_name","descKey":"prod_social_netflix_4k_desc","pricePayPal":3.50,"priceLTC":0.00042,"pricePSC":3.50,"image":"https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60","stock":29},
  {"id":"social-netflix-random","columnId":"Social","nameKey":"prod_social_netflix_random_name","descKey":"prod_social_netflix_random_desc","pricePayPal":1.50,"priceLTC":0.00018,"pricePSC":1.50,"image":"https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60","stock":29},
  {"id":"social-prime-video-lifetime","columnId":"Social","nameKey":"prod_social_prime_video_lifetime_name","descKey":"prod_social_prime_video_lifetime_desc","pricePayPal":3.15,"priceLTC":0.00038,"pricePSC":3.50,"image":"https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60","stock":29},
  {"id":"social-prime-video-6months","columnId":"Social","nameKey":"prod_social_prime_video_6months_name","descKey":"prod_social_prime_video_6months_desc","pricePayPal":2.00,"priceLTC":0.00024,"pricePSC":2.00,"image":"https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60","stock":29},
  {"id":"social-prime-video-1month","columnId":"Social","nameKey":"prod_social_prime_video_1month_name","descKey":"prod_social_prime_video_1month_desc","pricePayPal":1.20,"priceLTC":0.00014,"pricePSC":1.50,"image":"https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60","stock":29},
  {"id":"social-youtube-premium-lifetime-fa","columnId":"Social","nameKey":"prod_social_youtube_premium_lifetime_fa_name","descKey":"prod_social_youtube_premium_lifetime_fa_desc","pricePayPal":2.50,"priceLTC":0.00030,"pricePSC":2.50,"image":"https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60","stock":29},
  {"id":"social-youtube-premium-family-owner-lifetime-fa","columnId":"Social","nameKey":"prod_social_youtube_premium_family_owner_lifetime_fa_name","descKey":"prod_social_youtube_premium_family_owner_lifetime_fa_desc","pricePayPal":3.50,"priceLTC":0.00042,"pricePSC":3.50,"image":"https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60","stock":29},
  {"id":"social-chatgpt-plus-fa-1month","columnId":"Social","nameKey":"prod_social_chatgpt_plus_fa_1month_name","descKey":"prod_social_chatgpt_plus_fa_1month_desc","pricePayPal":2.80,"priceLTC":0.00034,"pricePSC":3.00,"image":"https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60","stock":29},
  {"id":"social-chatgpt-go-fa-1year","columnId":"Social","nameKey":"prod_social_chatgpt_go_fa_1year_name","descKey":"prod_social_chatgpt_go_fa_1year_desc","pricePayPal":9.90,"priceLTC":0.00119,"pricePSC":10.00,"image":"https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60","stock":29},
  {"id":"social-hbo-max","columnId":"Social","nameKey":"prod_social_hbo_max_name","descKey":"prod_social_hbo_max_desc","pricePayPal":2.45,"priceLTC":0.00029,"pricePSC":2.50,"image":"https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60","stock":29},
  {"id":"social-disney+-lifetime","columnId":"Social","nameKey":"prod_social_disney+_lifetime_name","descKey":"prod_social_disney+_lifetime_desc","pricePayPal":2.40,"priceLTC":0.00029,"pricePSC":2.50,"image":"https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60","stock":29},
  {"id":"social-disney+-only","columnId":"Social","nameKey":"prod_social_disney+_only_name","descKey":"prod_social_disney+_only_desc","pricePayPal":2.40,"priceLTC":0.00029,"pricePSC":2.50,"image":"https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60","stock":25},
  {"id":"social-disney+-hulu","columnId":"Social","nameKey":"prod_social_disney+_hulu_name","descKey":"prod_social_disney+_hulu_desc","pricePayPal":3.20,"priceLTC":0.00039,"pricePSC":3.50,"image":"https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60","stock":20},
  {"id":"social-disney+-hulu-espn","columnId":"Social","nameKey":"prod_social_disney+_hulu_espn_name","descKey":"prod_social_disney+_hulu_espn_desc","pricePayPal":3.90,"priceLTC":0.00047,"pricePSC":4.20,"image":"https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60","stock":18},
  {"id":"social-crunchyroll-lifetime-[fan]","columnId":"Social","nameKey":"prod_social_crunchyroll_lifetime_[fan]_name","descKey":"prod_social_crunchyroll_lifetime_[fan]_desc","pricePayPal":1.99,"priceLTC":0.00024,"pricePSC":2.20,"image":"https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60","stock":30},
  {"id":"social-crunchyroll-lifetime-[megafan]","columnId":"Social","nameKey":"prod_social_crunchyroll_lifetime_[megafan]_name","descKey":"prod_social_crunchyroll_lifetime_[megafan]_desc","pricePayPal":2.55,"priceLTC":0.00031,"pricePSC":3.00,"image":"https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60","stock":29},
  {"id":"social-paramount+-lifetime","columnId":"Social","nameKey":"prod_social_paramount+_lifetime_name","descKey":"prod_social_paramount+_lifetime_desc","pricePayPal":2.70,"priceLTC":0.00032,"pricePSC":3.00,"image":"https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60","stock":29},
  {"id":"deco-discord-decoration-4.99€","columnId":"Discord","nameKey":"prod_deco_discord_decoration_4.99€_name","descKey":"prod_deco_discord_decoration_4.99€_desc","pricePayPal":2.38,"priceLTC":0.00029,"pricePSC":2.50,"image":"https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60","stock":29},
  {"id":"deco-discord-decoration-5.99€","columnId":"Discord","nameKey":"prod_deco_discord_decoration_5.99€_name","descKey":"prod_deco_discord_decoration_5.99€_desc","pricePayPal":2.75,"priceLTC":0.00033,"pricePSC":3.00,"image":"https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60","stock":29},
  {"id":"deco-discord-decoration-6.99€","columnId":"Discord","nameKey":"prod_deco_discord_decoration_6.99€_name","descKey":"prod_deco_discord_decoration_6.99€_desc","pricePayPal":3.10,"priceLTC":0.00037,"pricePSC":3.50,"image":"https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60","stock":29},
  {"id":"deco-discord-decoration-7.99€","columnId":"Discord","nameKey":"prod_deco_discord_decoration_7.99€_name","descKey":"prod_deco_discord_decoration_7.99€_desc","pricePayPal":3.30,"priceLTC":0.00040,"pricePSC":4.00,"image":"https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60","stock":29},
  {"id":"deco-discord-decoration-8.49€","columnId":"Discord","nameKey":"prod_deco_discord_decoration_8.49€_name","descKey":"prod_deco_discord_decoration_8.49€_desc","pricePayPal":3.55,"priceLTC":0.00043,"pricePSC":4.00,"image":"https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60","stock":29},
  {"id":"deco-discord-decoration-9.99€","columnId":"Discord","nameKey":"prod_deco_discord_decoration_9.99€_name","descKey":"prod_deco_discord_decoration_9.99€_desc","pricePayPal":4.05,"priceLTC":0.00049,"pricePSC":4.50,"image":"https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60","stock":29},
  {"id":"deco-discord-decoration-11.99€","columnId":"Discord","nameKey":"prod_deco_discord_decoration_11.99€_name","descKey":"prod_deco_discord_decoration_11.99€_desc","pricePayPal":4.90,"priceLTC":0.00059,"pricePSC":5.00,"image":"https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60","stock":29},
  {"id":"deco-random-décoration","columnId":"Discord","nameKey":"prod_deco_random_décoration_name","descKey":"prod_deco_random_décoration_desc","pricePayPal":2.60,"priceLTC":0.00031,"pricePSC":3.00,"image":"https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60","stock":29},
  {"id":"vpn-ip-vanish-vpn-1-year","columnId":"VPN","nameKey":"prod_vpn_ip_vanish_vpn_1_year_name","descKey":"prod_vpn_ip_vanish_vpn_1_year_desc","pricePayPal":2.25,"priceLTC":0.00027,"pricePSC":2.50,"image":"https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60","stock":29},
  {"id":"vpn-mullvad-vpn-lifetime","columnId":"VPN","nameKey":"prod_vpn_mullvad_vpn_lifetime_name","descKey":"prod_vpn_mullvad_vpn_lifetime_desc","pricePayPal":5.50,"priceLTC":0.00066,"pricePSC":5.50,"image":"https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60","stock":29},
  {"id":"vpn-tunnelbear-vpn-lifetime","columnId":"VPN","nameKey":"prod_vpn_tunnelbear_vpn_lifetime_name","descKey":"prod_vpn_tunnelbear_vpn_lifetime_desc","pricePayPal":2.30,"priceLTC":0.00028,"pricePSC":2.50,"image":"https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60","stock":29},
  {"id":"vpn-nord-vpn-lifetime","columnId":"VPN","nameKey":"prod_vpn_nord_vpn_lifetime_name","descKey":"prod_vpn_nord_vpn_lifetime_desc","pricePayPal":3.60,"priceLTC":0.00043,"pricePSC":4.00,"image":"https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60","stock":29},
  {"id":"game-roblox-1000rbx","columnId":"Gaming","nameKey":"prod_game_roblox_1000rbx_name","descKey":"prod_game_roblox_1000rbx_desc","pricePayPal":8.50,"priceLTC":0.00102,"pricePSC":9.00,"image":"https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60","stock":29},
  {"id":"game-roblox-2000rbx","columnId":"Gaming","nameKey":"prod_game_roblox_2000rbx_name","descKey":"prod_game_roblox_2000rbx_desc","pricePayPal":15.00,"priceLTC":0.00180,"pricePSC":15.00,"image":"https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60","stock":29},
];

// ── Supabase helpers ──────────────────────────────────────────────────────────

async function supabaseLoad(): Promise<any[] | null> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/Products?select=*&limit=1`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
    if (!res.ok) return null;
    const rows = await res.json();
    if (!rows || rows.length === 0) return null;
    const data = rows[0]?.Data;
    // Validate: doit être un tableau de produits avec des vrais prix
    if (!Array.isArray(data) || data.length === 0) return null;
    const normalized = normalizeProducts(data);
    if (normalized[0].pricePayPal === 0 && normalized[0].priceLTC === 0) return null;
    return normalized;
  } catch { return null; }
}

async function supabaseSave(products: any[]): Promise<boolean> {
  try {
    const check = await fetch(`${SUPABASE_URL}/rest/v1/Products?select=id&limit=1`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
    const rows = await check.json();
    if (rows && rows.length > 0) {
      const upd = await fetch(`${SUPABASE_URL}/rest/v1/Products?id=eq.${rows[0].id}`, {
        method: "PATCH",
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ Data: products })
      });
      return upd.ok;
    } else {
      const ins = await fetch(`${SUPABASE_URL}/rest/v1/Products`, {
        method: "POST",
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ Data: products })
      });
      return ins.ok;
    }
  } catch { return false; }
}

// Pas de cache — toujours lire depuis Supabase pour avoir les vrais prix

export async function getProductsAsync(): Promise<any[]> {
  const fromSupabase = await supabaseLoad();
  if (fromSupabase) return fromSupabase;
  // Supabase vide → insérer les produits par défaut
  await supabaseSave(DEFAULT_PRODUCTS);
  return DEFAULT_PRODUCTS;
}

export async function saveProductsAsync(products: any[]): Promise<boolean> {
  return await supabaseSave(products);
}

export const getProducts = () => DEFAULT_PRODUCTS;

export const saveProducts = (products: any[]) => {
  supabaseSave(products).catch(() => {});
};

export const getSettings = () => {
  if (typeof window === 'undefined') return { pscFeePercent: 10 };
  const saved = localStorage.getItem('app_settings');
  return saved ? JSON.parse(saved) : { pscFeePercent: 10 };
};

export const saveSettings = (settings: any) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('app_settings', JSON.stringify(settings));
  }
};
