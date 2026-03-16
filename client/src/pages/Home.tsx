import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Zap, Lock, Star, ArrowRight, Search, Layers, ShoppingCart, Plus, Minus, X, CreditCard, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";
import { getProductsAsync, getSettings } from "@/lib/products";
import { useCart } from "@/contexts/CartContext";
import PaymentMethodSelector from "@/components/PaymentMethodSelector";

import { useLocation } from "wouter";
import { toast } from "sonner";

// Groupes de produits : une carte mère → plusieurs variantes sur une page dédiée
export const SOCIAL_IMAGES: Record<string, string> = {};

export const PRODUCT_GROUPS: Record<string, { label: string; image: string; ids: string[]; category: string }> = {
  "group-netflix": {
    label: "Netflix",
    image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60",
    category: "Social",
    ids: [
      "social-netflix-no-ads",
      "social-netflix-4k",
      "social-netflix-random",
    ],
  },
  "group-prime-video": {
    label: "Prime Video",
    image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60",
    category: "Social",
    ids: [
      "social-prime-video-lifetime",
      "social-prime-video-6months",
      "social-prime-video-1month",
    ],
  },
  "group-youtube": {
    label: "YouTube Premium",
    image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60",
    category: "Social",
    ids: [
      "social-youtube-premium-lifetime-fa",
      "social-youtube-premium-family-owner-lifetime-fa",
    ],
  },
  "group-chatgpt": {
    label: "ChatGPT",
    image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60",
    category: "Social",
    ids: [
      "social-chatgpt-plus-fa-1month",
      "social-chatgpt-go-fa-1year",
    ],
  },
  "group-disneyplus": {
    label: "Disney+",
    image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60",
    category: "Social",
    ids: [
      "social-disney+-only",
      "social-disney+-hulu",
      "social-disney+-hulu-espn",
      "social-disney+-lifetime",
    ],
  },
  "group-crunchyroll": {
    label: "Crunchyroll",
    image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60",
    category: "Social",
    ids: [
      "social-crunchyroll-lifetime-[fan]",
      "social-crunchyroll-lifetime-[megafan]",
    ],
  },
  "group-discord-accounts": {
    label: "Comptes Discord",
    image: "https://images.unsplash.com/photo-1614680376739-414d95ff43df?w=800&auto=format&fit=crop&q=60",
    category: "Discord",
    ids: [
      "acc-2025-account",
      "acc-2024-account",
      "acc-2023-account",
      "acc-2022-account",
      "acc-2021-account",
      "acc-2020-account",
      "acc-2019-account",
      "acc-2018-account",
      "acc-2017-account",
      "acc-2016-account",
      "acc-2015-account",
    ],
  },
  "group-discord-decorations": {
    label: "Décorations Discord",
    image: "https://images.unsplash.com/photo-1614680376739-414d95ff43df?w=800&auto=format&fit=crop&q=60",
    category: "Discord",
    ids: [
      "deco-discord-decoration-4.99€",
      "deco-discord-decoration-5.99€",
      "deco-discord-decoration-6.99€",
      "deco-discord-decoration-7.99€",
      "deco-discord-decoration-8.49€",
      "deco-discord-decoration-9.99€",
      "deco-discord-decoration-11.99€",
      "deco-random-décoration",
    ],
  },
};

// IDs qui font partie d'un groupe (on les cache de la grille principale)
const GROUPED_IDS = new Set(Object.values(PRODUCT_GROUPS).flatMap((g) => g.ids));
const SUPABASE_URL = "https://eqzcmxtrkgmcjhvbnefq.supabase.co";
const SUPABASE_KEY = "sb_publishable_efQGrrNRPLO7uLmKqsA5Jw_uyGx5Cc7";

async function loadSupabaseGroups(): Promise<any[]> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/Groups?select=*&order=id.asc`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
    if (!res.ok) return [];
    return await res.json() || [];
  } catch { return []; }
}



const DISCORD_TICKET = "https://discord.com/channels/1476550378987454534/1476973014460530718";

const DiscordIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 11.747 11.747 0 0 0-.617-1.25.077.077 0 0 0-.079-.037 19.736 19.736 0 0 0-4.885 1.515.069.069 0 0 0-.032.027C.533 9.048-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.419-2.157 2.419z"/>
  </svg>
);

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "circOut" as const } }
};

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("All");
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [supabaseGroups, setSupabaseGroups] = useState<any[]>([]);
  const { language } = useLanguage();
  const t = (translations[language as keyof typeof translations] || translations.en) as any;
  const { addToCart } = useCart();
  const settings = getSettings();
  const [, navigate] = useLocation();
  const [productPaymentMethods, setProductPaymentMethods] = useState<Record<string, { method: 'paypal' | 'ltc' | 'paysafecard'; email?: string; pin?: string; quantity: number }>>({});

  useEffect(() => {
    getProductsAsync().then(setProducts);
    loadSupabaseGroups().then(setSupabaseGroups);
  }, []);

  // Normalise les catégories (trim + capitalize) pour éviter les doublons
  const normalizeCategory = (cat: string) => cat.trim().charAt(0).toUpperCase() + cat.trim().slice(1).toLowerCase().charAt(0).toUpperCase() + cat.trim().slice(1).toLowerCase().slice(1);
  const categories = ["All", ...Array.from(new Set(products.map((p: any) => normalizeCategory(p.columnId.toString()))))];

  // Produits individuels visibles (hors ceux dans un groupe)
  const filteredProducts = products.filter((product: any) => {
    if (GROUPED_IDS.has(product.id)) return false;
    const name = (t as any)[product.nameKey] || product.nameKey;
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag === "All" || normalizeCategory(product.columnId) === selectedTag;
    return matchesSearch && matchesTag;
  });

  // Groupes visibles selon filtre
  const visibleGroups = Object.entries(PRODUCT_GROUPS).filter(([, group]) => {
    if (selectedTag !== "All" && selectedTag !== normalizeCategory(group.category)) return false;
    if (searchQuery) {
      return group.label.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const handleAddToCart = (product: any, silent = false) => {
    const state = productPaymentMethods[product.id] || { method: 'paypal', quantity: 1 };
    const { method, email, pin } = state;
    if (method === 'paysafecard' && !pin && !silent) {
      toast.error((t as any).enterPscPin || 'Veuillez entrer votre code PIN Paysafecard');
      setExpandedProductId(product.id);
      return;
    }
    addToCart({
      id: `${product.id}-${Date.now()}`,
      productId: product.id,
      quantity: state.quantity,
      paymentMethod: method,
      pricePayPal: product.pricePayPal,
      priceLTC: product.priceLTC,
      pricePSC: product.pricePSC,
      pscFeePercent: settings.pscFeePercent,
      buyerEmail: email || '',
      paysafecardPin: pin,
      productName: (t as any)[product.nameKey] || product.nameKey,
      productImage: product.image,
    });
    if (!silent) toast.success((t as any).addedToCart || 'Ajouté au panier !');
    setProductPaymentMethods(prev => ({ ...prev, [product.id]: { method: 'paypal', quantity: 1 } }));
    setExpandedProductId(null);
  };

  const handleBuyNow = (product: any) => {
    handleAddToCart(product, true);
    navigate('/checkout');
  };

  const scrollToStore = () => {
    const storeSection = document.getElementById('store');
    if (storeSection) storeSection.scrollIntoView({ behavior: 'smooth' });
  };

  const totalVisible = filteredProducts.length + visibleGroups.length;

  return (
    <div className="w-full bg-[#030711] overflow-x-hidden relative">
      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 w-full h-[450px] bg-[#030711]" />
        <div className="absolute top-[450px] bottom-0 w-full bg-white/[0.01] backdrop-blur-[20px]" />
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden z-10">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[150px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[130px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
          <div className="absolute top-[40%] right-[10%] w-[30%] h-[30%] bg-indigo-600/5 blur-[100px] rounded-full" />
        </div>
        <div className="container relative z-10">
          <motion.div initial="hidden" animate="visible" variants={containerVariants} className="max-w-5xl mx-auto text-center space-y-10">
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.08] backdrop-blur-md shadow-2xl">
              <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
              <span className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-400">{(t as any).heroBadge || "NOUVELLE COLLECTION 2026 DISPONIBLE"}</span>
            </motion.div>
            <motion.h1 variants={itemVariants} className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-[0.85] text-white">
              {(t as any).heroTitle ? (t as any).heroTitle.split(' ').slice(0, -1).join(' ') : "Axa"} <span className="gradient-text">{(t as any).heroTitle ? (t as any).heroTitle.split(' ').slice(-1) : "Shop"}</span>
            </motion.h1>
            <motion.p variants={itemVariants} className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium">
              {(t as any).heroDesc || "Le meilleur marché pour vos besoins numériques. Comptes premium, services et outils au meilleur prix."}
            </motion.p>
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-6">
              <Button size="lg" onClick={scrollToStore} className="h-16 px-10 bg-primary hover:bg-primary/90 text-white font-black text-lg rounded-2xl shadow-[0_0_40px_-10px_rgba(59,130,246,0.5)] transition-all hover:scale-105 active:scale-95 group">
                {(t as any).exploreStore || "Explorer le catalogue"}
                <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="outline" size="lg" className="h-16 px-10 border-white/10 text-white hover:bg-white/5 font-black text-lg rounded-2xl backdrop-blur-sm transition-all" asChild>
                <a href="/vouchers">{(t as any).viewVouchers || "Voir les Vouchers"}</a>
              </Button>
            </motion.div>
            <motion.div variants={itemVariants} className="pt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { icon: <ShieldCheck className="w-6 h-6 text-primary" />, label: (t as any).securePayments || "Paiements Sécurisés" },
                { icon: <Zap className="w-6 h-6 text-primary" />, label: (t as any).instantDelivery || "Livraison Instantanée" },
                { icon: <Lock className="w-6 h-6 text-primary" />, label: (t as any).encryptedData || "Données Chiffrées" },
                { icon: <Star className="w-6 h-6 text-primary" />, label: (t as any).topRatedService || "Service Mieux Noté" }
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl bg-white/[0.05] border border-white/10 backdrop-blur-sm hover:bg-white/[0.08] transition-all group">
                  <div className="p-3 rounded-xl bg-primary/10 group-hover:scale-110 transition-transform">{item.icon}</div>
                  <span className="text-[11px] font-black uppercase tracking-[0.15em] text-white">{item.label}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Store Section */}
      <section id="store" className="py-32 relative z-30">
        <div className="container">
          <div className="max-w-7xl mx-auto">
            {/* Store Header */}
            <div className="flex flex-col lg:flex-row justify-between items-end gap-12 mb-20">
              <div className="space-y-6 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                  <Layers className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[10px] font-black tracking-widest uppercase text-primary">{(t as any).digitalInventory || "INVENTAIRE NUMÉRIQUE"}</span>
                </div>
                <h2 className="text-5xl md:text-6xl font-black tracking-tighter text-white">
                  {(t as any).storeTitle || "Notre Collection"}
                </h2>
                <p className="text-lg text-slate-400 leading-relaxed font-medium">
                  {(t as any).storeDesc || "Produits premium sélectionnés pour les utilisateurs les plus exigeants."}
                </p>
              </div>
              <div className="w-full lg:w-auto space-y-6">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-primary transition-colors" />
                  <Input
                    placeholder={(t as any).searchPlaceholder || "Rechercher un produit..."}
                    className="h-16 pl-12 pr-6 bg-white/[0.02] border-white/10 rounded-2xl w-full lg:w-[400px] focus:ring-primary/20 focus:border-primary/30 transition-all text-white font-medium"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {categories.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(tag)}
                      className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                        selectedTag === tag
                          ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                          : "bg-[#0f172a] border-white/10 text-slate-400 hover:border-white/20 hover:text-white"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

              {/* === GROUPES SUPABASE (créés depuis admin) === */}
              {supabaseGroups
                .filter(g => selectedTag === "All" || selectedTag.toLowerCase() === normalizeCategory(g.category || "").toLowerCase())
                .filter(g => !searchQuery || (g.label || "").toLowerCase().includes(searchQuery.toLowerCase()))
                .map((g: any) => {
                  const opts = g.options || [];
                  const minPrice = opts.length > 0 ? Math.min(...opts.map((o: any) => parseFloat(o.pricePayPal) || 0)) : 0;
                  const groupImg = opts[0]?.image || g.image;
                  return (
                    <motion.div key={`sg-${g.id}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                      className="group bg-white/[0.02] border border-white/[0.05] rounded-[2rem] overflow-hidden hover:border-primary/30 transition-all duration-500 flex flex-col h-full cursor-pointer"
                      onClick={() => navigate(`/product/sg-${g.id}`)}>
                      <div className="aspect-[4/3] overflow-hidden relative">
                        {groupImg
                          ? <img src={groupImg} alt={g.label} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                          : <div className="w-full h-full bg-white/[0.03]" />}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#030711] via-transparent to-transparent opacity-60" />
                        <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-[#030711]/80 backdrop-blur-md border border-white/10 text-[10px] font-black text-white uppercase tracking-tighter">{g.category}</div>
                        <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-primary/20 backdrop-blur-md border border-primary/30 text-[10px] font-black text-primary uppercase tracking-tighter">{opts.length} options</div>
                      </div>
                      <div className="p-8 flex flex-col flex-1">
                        <h3 className="text-xl font-bold text-white leading-tight group-hover:text-primary transition-colors mb-2">{g.label}</h3>
                        <p className="text-sm text-slate-400 mb-8 font-medium">{opts.length} {(t as any).variantsAvailable || "variantes disponibles"} — {(t as any).from || "à partir de"} €{minPrice.toFixed(2)}</p>
                        <div className="mt-auto pt-6 border-t border-white/[0.05]">
                          <Button className="w-full h-12 bg-white/[0.05] hover:bg-primary/20 text-white font-black rounded-2xl transition-all border border-white/10 hover:border-primary/40 flex items-center justify-center gap-2">
                            {(t as any).seeOptions || "Voir les options"}<ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

              {/* === CARTES GROUPES HARDCODÉS === */}

              {visibleGroups.map(([groupId, group]) => {
                const groupProducts = products.filter(p => group.ids.includes(p.id));
                const minPrice = groupProducts.length > 0 ? Math.min(...groupProducts.map(p => p.pricePayPal)) : 0;
                const groupImg = groupProducts[0]?.image || group.image;

                return (
                  <motion.div
                    key={groupId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group bg-white/[0.02] border border-white/[0.05] rounded-[2rem] overflow-hidden hover:border-primary/30 transition-all duration-500 flex flex-col h-full cursor-pointer"
                    onClick={() => navigate(`/product/${groupId}`)}
                  >
                    <div className="aspect-[4/3] overflow-hidden relative">
                      <img src={groupImg} alt={group.label} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#030711] via-transparent to-transparent opacity-60" />
                      <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-[#030711]/80 backdrop-blur-md border border-white/10 text-[10px] font-black text-white uppercase tracking-tighter">
                        {group.category}
                      </div>
                      <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-primary/20 backdrop-blur-md border border-primary/30 text-[10px] font-black text-primary uppercase tracking-tighter">
                        {groupProducts.length} options
                      </div>
                    </div>
                    <div className="p-8 flex flex-col flex-1">
                      <h3 className="text-xl font-bold text-white leading-tight group-hover:text-primary transition-colors mb-2">
                        {group.label}
                      </h3>
                      <p className="text-sm text-slate-400 mb-8 font-medium">
                        {groupProducts.length} {(t as any).variantsAvailable || "variantes disponibles"} — {(t as any).from || "à partir de"} €{minPrice.toFixed(2)}
                      </p>
                      <div className="mt-auto pt-6 border-t border-white/[0.05]">
                        <Button className="w-full h-12 bg-white/[0.05] hover:bg-primary/20 text-white font-black rounded-2xl transition-all border border-white/10 hover:border-primary/40 flex items-center justify-center gap-2">
                          {(t as any).seeOptions || "Voir les options"}
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {/* === PRODUITS INDIVIDUELS (tous les autres) === */}
              {filteredProducts.map((product: any) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  className="group bg-white/[0.02] border border-white/[0.05] rounded-[2rem] overflow-hidden hover:border-primary/30 transition-all duration-500 flex flex-col h-full"
                >
                  <div className="aspect-[4/3] overflow-hidden relative">
                    <img
                      src={product.image}
                      alt={(t as any)[product.nameKey] || product.nameKey}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#030711] via-transparent to-transparent opacity-60" />
                    <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-[#030711]/80 backdrop-blur-md border border-white/10 text-[10px] font-black text-white uppercase tracking-tighter">
                      {product.columnId}
                    </div>
                    <div className="absolute top-4 right-4 px-4 py-1.5 rounded-full bg-[#030711]/80 backdrop-blur-md border border-white/10 text-xs font-bold text-white uppercase tracking-tight flex items-center gap-2 shadow-lg shadow-black/20">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      {(product.stock || 0) >= 9999 ? "∞" : (product.stock || 0)} {(t as any).inStock || "in stock"}
                    </div>
                  </div>
                  <div className="p-8 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold text-white leading-tight group-hover:text-primary transition-colors">
                        {(t as any)[product.nameKey] || product.nameKey}
                      </h3>
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed mb-8 line-clamp-2 font-medium">
                      {(t as any)[product.descKey] || product.descKey}
                    </p>
                    <div className="mt-auto pt-6 border-t border-white/[0.05] space-y-4">
                      <div className="flex flex-col gap-2">
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 flex justify-between items-center">
                          <p className="text-xs font-black text-blue-400 uppercase tracking-tighter">PayPal</p>
                          <p className="text-base font-black text-white whitespace-nowrap">€{product.pricePayPal.toFixed(2)}</p>
                        </div>
                        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3 flex justify-between items-center">
                          <p className="text-xs font-black text-orange-400 uppercase tracking-tighter">LTC</p>
                          <p className="text-base font-black text-white whitespace-nowrap">€{(parseFloat(product.priceLTC)||0).toFixed(2)}</p>
                        </div>
                        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 flex justify-between items-center">
                          <p className="text-xs font-black text-green-400 uppercase tracking-tighter">PSC</p>
                          <p className="text-base font-black text-white whitespace-nowrap">€{(product.pricePSC * (1 + settings.pscFeePercent / 100)).toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <a href={DISCORD_TICKET} target="_blank" rel="noopener noreferrer" className="flex-1" onClick={(e) => e.stopPropagation()}>
                          <Button className="w-full h-12 bg-[#5865F2] hover:bg-[#4752C4] text-white font-black rounded-2xl transition-all shadow-lg shadow-[#5865F2]/20 flex items-center justify-center gap-2">
                            <DiscordIcon className="w-4 h-4 shrink-0" />
                            {(t as any).openTicket || "Ouvrir un ticket"}
                          </Button>
                        </a>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Empty State */}
            {totalVisible === 0 && (
              <div className="text-center py-40 glass-card rounded-[3rem] border-dashed border-white/10">
                <Search className="w-16 h-16 text-slate-700 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-white mb-2">{(t as any).noProductsFound || "Aucun produit trouvé"}</h3>
                <p className="text-slate-500">{(t as any).tryAdjustingSearch || "Essayez d'ajuster votre recherche ou vos filtres."}</p>
                <Button variant="link" className="mt-4 text-primary font-bold" onClick={() => { setSearchQuery(""); setSelectedTag("All"); }}>
                  {(t as any).clearFilters || "Effacer les filtres"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Expanded Product Modal (pour produits individuels si besoin) */}
      <AnimatePresence>
        {expandedProductId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setExpandedProductId(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card rounded-[2.5rem] border-white/[0.05] p-10 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const product = products.find(p => p.id === expandedProductId);
                if (!product) return null;
                const state = productPaymentMethods[product.id] || { method: 'paypal', quantity: 1 };
                return (
                  <div className="space-y-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-3xl font-black text-white mb-2">{(t as any)[product.nameKey] || product.nameKey}</h2>
                        <p className="text-slate-400">{(t as any)[product.descKey] || product.descKey}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setExpandedProductId(null)} className="text-slate-400 hover:text-white">
                        <X className="w-5 h-5" />
                      </Button>
                    </div>
                    <PaymentMethodSelector
                      selectedMethod={state.method}
                      onMethodChange={(method) => setProductPaymentMethods(prev => ({ ...prev, [product.id]: { ...state, method } }))}
                      pricePayPal={product.pricePayPal}
                      priceLTC={product.priceLTC}
                      pricePSC={product.pricePSC}
                      pscFeePercent={settings.pscFeePercent}
                      paysafecardPin={state.pin}
                      onPaysafecardPinChange={(pin) => setProductPaymentMethods(prev => ({ ...prev, [product.id]: { ...state, pin } }))}
                    />
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Quantité</p>
                      <div className="flex items-center gap-4 bg-white/[0.02] border border-white/10 rounded-2xl p-4 w-fit">
                        <Button size="icon" variant="ghost" onClick={() => setProductPaymentMethods(prev => ({ ...prev, [product.id]: { ...state, quantity: Math.max(1, state.quantity - 1) } }))} className="text-slate-400 hover:text-white">
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="text-2xl font-black text-white w-12 text-center">{state.quantity}</span>
                        <Button size="icon" variant="ghost" onClick={() => setProductPaymentMethods(prev => ({ ...prev, [product.id]: { ...state, quantity: state.quantity + 1 } }))} className="text-slate-400 hover:text-white">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-4 pt-6 border-t border-white/10">
                      <a href={DISCORD_TICKET} target="_blank" rel="noopener noreferrer" className="flex-1" onClick={(e) => e.stopPropagation()}>
                        <Button className="w-full h-14 bg-[#5865F2] hover:bg-[#4752C4] text-white font-black rounded-2xl flex items-center justify-center gap-2">
                          <DiscordIcon className="w-5 h-5 shrink-0" />
                          {(t as any).openTicket || "Ouvrir un ticket"}
                        </Button>
                      </a>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Features Section */}
      <section className="py-32 relative">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: (t as any).featureSecure || "Sécurisé", desc: (t as any).featureSecureDesc || "Vos données sont chiffrées et jamais partagées.", icon: <ShieldCheck className="w-8 h-8 text-primary" /> },
              { title: (t as any).featureInstant || "Instantané", desc: (t as any).featureInstantDesc || "Recevez vos produits immédiatement après l'achat.", icon: <Zap className="w-8 h-8 text-blue-400" /> },
              { title: (t as any).featureSupport || "Support", desc: (t as any).featureSupportDesc || "Une équipe dédiée pour vous aider 24/7.", icon: <Star className="w-8 h-8 text-indigo-400" /> }
            ].map((feature, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass-card p-10 rounded-[2.5rem] border-white/[0.05] hover:border-white/10 transition-all group">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed font-medium">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
