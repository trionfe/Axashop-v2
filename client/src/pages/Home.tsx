import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Zap, Lock, Star, ArrowRight, Search, Layers, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";
import { getProducts, getSettings } from "@/lib/products";
import { useLocation } from "wouter";

export const PRODUCT_GROUPS: Record<string, { label: string; category: string; image: string; ids: string[] }> = {
  "group-accounts": {
    label: "Compte Discord", category: "Accounts",
    image: "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=800&auto=format&fit=crop&q=60",
    ids: ["acc-2025-account","acc-2024-account","acc-2023-account","acc-2022-account","acc-2021-account","acc-2020-account","acc-2019-account","acc-2018-account","acc-2017-account","acc-2016-account","acc-2015-account"],
  },
  "group-discord-deco": {
    label: "Décoration Discord", category: "Discord",
    image: "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=800&auto=format&fit=crop&q=60",
    ids: ["deco-discord-decoration-4.99€","deco-discord-decoration-5.99€","deco-discord-decoration-6.99€","deco-discord-decoration-7.99€","deco-discord-decoration-8.49€","deco-discord-decoration-9.99€","deco-discord-decoration-11.99€","deco-random-décoration"],
  },
};

const GROUPED_IDS = new Set(Object.values(PRODUCT_GROUPS).flatMap((g) => g.ids));

export const SOCIAL_IMAGES: Record<string, string> = {
  "social-netflix-no-ads": "/banners/netflix.png",
  "social-netflix-4k": "/banners/netflix.png",
  "social-netflix-random": "/banners/netflix.png",
  "social-prime-video-lifetime": "/banners/prime-video.png",
  "social-prime-video-6months": "/banners/prime-video.png",
  "social-prime-video-1month": "/banners/prime-video.png",
  "social-youtube-premium-lifetime-fa": "/banners/youtube.png",
  "social-youtube-premium-family-owner-lifetime-fa": "/banners/youtube.png",
  "social-chatgpt-plus-fa-1month": "/banners/chatgpt.png",
  "social-chatgpt-go-fa-1year": "/banners/chatgpt.png",
  "social-hbo-max": "/banners/hbo-max.png",
  "social-disney+-lifetime": "/banners/disney-plus.png",
  "social-crunchyroll-lifetime-[megafan]": "/banners/crunchyroll.png",
  "social-paramount+-lifetime": "/banners/paramount-plus.png",
};

const DISCORD_TICKET = "https://discord.com/channels/1476550378987454534/1476973014460530718";

const DiscordIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 11.747 11.747 0 0 0-.617-1.25.077.077 0 0 0-.079-.037 19.736 19.736 0 0 0-4.885 1.515.069.069 0 0 0-.032.027C.533 9.048-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.419-2.157 2.419z"/>
  </svg>
);

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "circOut" as const } } };

const StockBadge = ({ stock, t }: { stock: number; t: any }) => {
  const isOut = stock === 0;
  return (
    <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-full backdrop-blur-md border text-xs font-bold uppercase tracking-tight flex items-center gap-2 ${isOut ? "bg-[#030711]/80 border-red-500/40 text-red-400" : "bg-[#030711]/80 border-white/10 text-white"}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${isOut ? "bg-red-500" : "bg-green-500 animate-pulse"}`} />
      {isOut ? (t.outOfStock || "Out of Stock") : `${stock} ${t.inStock || "in stock"}`}
    </div>
  );
};

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("All");
  const [products, setProducts] = useState<any[]>([]);
  const { language } = useLanguage();
  const t = (translations[language as keyof typeof translations] || translations.en) as any;
  const settings = getSettings();
  const [, navigate] = useLocation();

  useEffect(() => { setProducts(getProducts()); }, []);

  const categories = ["All", ...Array.from(new Set(products.map((p: any) => p.columnId.toString())))];

  const filteredProducts = products.filter((product: any) => {
    if (GROUPED_IDS.has(product.id)) return false;
    const name = t[product.nameKey] || product.nameKey;
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) || product.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag === "All" || product.columnId === selectedTag;
    return matchesSearch && matchesTag;
  });

  const visibleGroups = Object.entries(PRODUCT_GROUPS).filter(([, group]) => {
    const categoryMatch = selectedTag === "All" || selectedTag === group.category;
    if (!categoryMatch) return false;
    if (searchQuery) return group.label.toLowerCase().includes(searchQuery.toLowerCase());
    return true;
  });

  const totalVisible = filteredProducts.length + visibleGroups.length;
  const scrollToStore = () => document.getElementById("store")?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="w-full bg-[#030711] overflow-x-hidden relative">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 w-full h-[450px] bg-[#030711]" />
        <div className="absolute top-[450px] bottom-0 w-full bg-white/[0.01] backdrop-blur-[20px]" />
      </div>

      {/* HERO */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden z-10">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[150px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[130px] rounded-full animate-pulse" style={{ animationDelay: "2s" }} />
        </div>
        <div className="container relative z-10">
          <motion.div initial="hidden" animate="visible" variants={containerVariants} className="max-w-5xl mx-auto text-center space-y-10">
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.08] backdrop-blur-md shadow-2xl">
              <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
              <span className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-400">{t.heroBadge || "NOUVELLE COLLECTION 2026 DISPONIBLE"}</span>
            </motion.div>
            <motion.h1 variants={itemVariants} className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-[0.85] text-white">
              {t.heroTitle ? t.heroTitle.split(" ").slice(0,-1).join(" ") : "Axa"}{" "}
              <span className="gradient-text">{t.heroTitle ? t.heroTitle.split(" ").slice(-1) : "Shop"}</span>
            </motion.h1>
            <motion.p variants={itemVariants} className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium">
              {t.heroDesc || "Le meilleur marché pour vos besoins numériques."}
            </motion.p>
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-6">
              <Button size="lg" onClick={scrollToStore} className="h-16 px-10 bg-primary hover:bg-primary/90 text-white font-black text-lg rounded-2xl shadow-[0_0_40px_-10px_rgba(59,130,246,0.5)] transition-all hover:scale-105 active:scale-95 group">
                {t.exploreStore || "Explorer le catalogue"}<ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="outline" size="lg" className="h-16 px-10 border-white/10 text-white hover:bg-white/5 font-black text-lg rounded-2xl backdrop-blur-sm transition-all" asChild>
                <a href="/vouchers">{t.viewVouchers || "Voir les Vouchers"}</a>
              </Button>
            </motion.div>
            <motion.div variants={itemVariants} className="pt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { icon: <ShieldCheck className="w-6 h-6 text-primary" />, label: t.securePayments || "Paiements Sécurisés" },
                { icon: <Zap className="w-6 h-6 text-primary" />, label: t.instantDelivery || "Livraison Instantanée" },
                { icon: <Lock className="w-6 h-6 text-primary" />, label: t.encryptedData || "Données Chiffrées" },
                { icon: <Star className="w-6 h-6 text-primary" />, label: t.topRatedService || "Service Mieux Noté" },
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

      {/* STORE */}
      <section id="store" className="py-32 relative z-30">
        <div className="container">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row justify-between items-end gap-12 mb-20">
              <div className="space-y-6 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                  <Layers className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[10px] font-black tracking-widest uppercase text-primary">{t.digitalInventory || "INVENTAIRE NUMÉRIQUE"}</span>
                </div>
                <h2 className="text-5xl md:text-6xl font-black tracking-tighter text-white">{t.storeTitle || "Notre Collection"}</h2>
                <p className="text-lg text-slate-400 leading-relaxed font-medium">{t.storeDesc || "Produits premium sélectionnés pour les utilisateurs les plus exigeants."}</p>
              </div>
              <div className="w-full lg:w-auto space-y-6">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-primary transition-colors" />
                  <Input placeholder={t.searchPlaceholder || "Rechercher..."} className="h-16 pl-12 pr-6 bg-white/[0.02] border-white/10 rounded-2xl w-full lg:w-[400px] text-white font-medium" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <div className="flex flex-wrap gap-2">
                  {categories.map((tag) => (
                    <button key={tag} onClick={() => setSelectedTag(tag)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${selectedTag === tag ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" : "bg-[#0f172a] border-white/10 text-slate-400 hover:border-white/20 hover:text-white"}`}>{tag}</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {/* GROUPES */}
              {visibleGroups.map(([groupId, group]) => {
                const groupProducts = products.filter(p => group.ids.includes(p.id));
                const minPrice = groupProducts.length > 0 ? Math.min(...groupProducts.map(p => p.pricePayPal)) : 0;
                return (
                  <motion.div key={groupId} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="group bg-white/[0.02] border border-white/[0.05] rounded-[2rem] overflow-hidden hover:border-primary/30 transition-all duration-500 flex flex-col h-full cursor-pointer"
                    onClick={() => navigate(`/product/${groupId}`)}>
                    <div className="aspect-[4/3] overflow-hidden relative">
                      <img src={group.image} alt={group.label} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#030711] via-transparent to-transparent opacity-60" />
                      <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-[#030711]/80 backdrop-blur-md border border-white/10 text-[10px] font-black text-white uppercase tracking-tighter">{group.category}</div>
                      <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-primary/20 backdrop-blur-md border border-primary/30 text-[10px] font-black text-primary uppercase tracking-tighter">{groupProducts.length} {t.options || "options"}</div>
                    </div>
                    <div className="p-8 flex flex-col flex-1">
                      <h3 className="text-xl font-bold text-white leading-tight group-hover:text-primary transition-colors mb-2">{group.label}</h3>
                      <p className="text-sm text-slate-400 mb-8 font-medium">{groupProducts.length} {t.variantsAvailable || "variantes"} — {t.from || "à partir de"} €{minPrice.toFixed(2)}</p>
                      <div className="mt-auto pt-6 border-t border-white/[0.05]">
                        <Button className="w-full h-12 bg-white/[0.05] hover:bg-primary/20 text-white font-black rounded-2xl transition-all border border-white/10 hover:border-primary/40 flex items-center justify-center gap-2">
                          {t.seeOptions || "Voir les options"}<ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {/* INDIVIDUELS */}
              {filteredProducts.map((product: any) => {
                const isOut = (product.stock ?? 0) === 0;
                const isSocial = product.columnId === "Social";
                const cardImage = SOCIAL_IMAGES[product.id] || product.image;
                return (
                  <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                    className={`group bg-white/[0.02] border border-white/[0.05] rounded-[2rem] overflow-hidden hover:border-primary/30 transition-all duration-500 flex flex-col h-full ${isSocial ? "cursor-pointer" : ""}`}
                    onClick={() => { if (isSocial) navigate(`/product/${product.id}`); }}>
                    <div className="aspect-[4/3] overflow-hidden relative">
                      <img src={cardImage} alt={t[product.nameKey] || product.nameKey} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#030711] via-transparent to-transparent opacity-60" />
                      <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-[#030711]/80 backdrop-blur-md border border-white/10 text-[10px] font-black text-white uppercase tracking-tighter">{product.columnId}</div>
                      <StockBadge stock={product.stock ?? 0} t={t} />
                    </div>
                    <div className="p-8 flex flex-col flex-1">
                      <h3 className="text-xl font-bold text-white leading-tight group-hover:text-primary transition-colors mb-3">{t[product.nameKey] || product.nameKey}</h3>
                      <p className="text-sm text-slate-400 leading-relaxed mb-6 line-clamp-2 font-medium">{t[product.descKey] || product.descKey}</p>
                      <div className="mt-auto pt-6 border-t border-white/[0.05] space-y-3">
                        <div className="flex flex-col gap-1.5">
                          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 flex justify-between items-center">
                            <p className="text-xs font-black text-blue-400 uppercase tracking-tighter">PayPal</p>
                            <p className="text-base font-black text-white">€{product.pricePayPal.toFixed(2)}</p>
                          </div>
                          <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3 flex justify-between items-center">
                            <p className="text-xs font-black text-orange-400 uppercase tracking-tighter">LTC</p>
                            <p className="text-base font-black text-white">€{product.pricePayPal.toFixed(2)}</p>
                          </div>
                          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 flex justify-between items-center">
                            <p className="text-xs font-black text-green-400 uppercase tracking-tighter">PSC</p>
                            <p className="text-base font-black text-white">€{(product.pricePSC * (1 + settings.pscFeePercent / 100)).toFixed(2)}</p>
                          </div>
                        </div>
                        {isSocial ? (
                          <Button className="w-full h-12 bg-white/[0.05] hover:bg-primary/20 text-white font-black rounded-2xl transition-all border border-white/10 hover:border-primary/40 flex items-center justify-center gap-2"
                            onClick={(e) => { e.stopPropagation(); navigate(`/product/${product.id}`); }}>
                            {t.seeOptions || "Voir les détails"}<ChevronRight className="w-4 h-4" />
                          </Button>
                        ) : (
                          <a href={DISCORD_TICKET} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                            <Button className="w-full h-12 bg-[#5865F2] hover:bg-[#4752C4] text-white font-black rounded-2xl transition-all shadow-lg shadow-[#5865F2]/20 flex items-center justify-center gap-2">
                              <DiscordIcon className="w-4 h-4 shrink-0" />{t.openTicket || "Ouvrir un ticket"}
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {totalVisible === 0 && (
              <div className="text-center py-40">
                <Search className="w-16 h-16 text-slate-700 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-white mb-2">{t.noProductsFound || "Aucun produit trouvé"}</h3>
                <Button variant="link" className="mt-4 text-primary font-bold" onClick={() => { setSearchQuery(""); setSelectedTag("All"); }}>{t.clearFilters || "Effacer les filtres"}</Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-32 relative">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: t.featureSecure || "Sécurisé", desc: t.featureSecureDesc || "Vos données sont chiffrées.", icon: <ShieldCheck className="w-8 h-8 text-primary" /> },
              { title: t.featureInstant || "Instantané", desc: t.featureInstantDesc || "Recevez vos produits immédiatement.", icon: <Zap className="w-8 h-8 text-blue-400" /> },
              { title: t.featureSupport || "Support", desc: t.featureSupportDesc || "Une équipe dédiée 24/7.", icon: <Star className="w-8 h-8 text-indigo-400" /> },
            ].map((feature, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass-card p-10 rounded-[2.5rem] border-white/[0.05] hover:border-white/10 transition-all group">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">{feature.icon}</div>
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
