import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ShieldCheck, Zap, Star, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";
import { getProducts, getSettings } from "@/lib/products";
import { PRODUCT_GROUPS, SOCIAL_IMAGES } from "@/pages/Home";

const DISCORD_TICKET = "https://discord.com/channels/1476550378987454534/1476973014460530718";

const DiscordIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 11.747 11.747 0 0 0-.617-1.25.077.077 0 0 0-.079-.037 19.736 19.736 0 0 0-4.885 1.515.069.069 0 0 0-.032.027C.533 9.048-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.419-2.157 2.419z"/>
  </svg>
);

const PRICE_ROWS = [
  {
    id: "paypal",
    label: "PayPal",
    color: "text-blue-400",
    border: "border-blue-500/30",
    bg: "bg-blue-500/10",
    getAmount: (p: any, _fee: number) => `€${p.pricePayPal.toFixed(2)}`,
  },
  {
    id: "ltc",
    label: "Litecoin",
    color: "text-orange-400",
    border: "border-orange-500/30",
    bg: "bg-orange-500/10",
    getAmount: (p: any, _fee: number) => `€${p.pricePayPal.toFixed(2)}`,
  },
  {
    id: "psc",
    label: "Paysafecard",
    color: "text-green-400",
    border: "border-green-500/30",
    bg: "bg-green-500/10",
    getAmount: (p: any, fee: number) => `€${(p.pricePSC * (1 + fee / 100)).toFixed(2)}`,
  },
];

export default function ProductPage() {
  const params = useParams<{ groupId: string }>();
  const [, navigate] = useLocation();
  const { language } = useLanguage();
  const t = (translations[language as keyof typeof translations] || translations.en) as any;
  const settings = getSettings();
  const allProducts = getProducts();

  const productId = params.groupId;
  const group = PRODUCT_GROUPS[productId];
  const singleProduct = !group ? allProducts.find(p => p.id === productId) : null;
  const variants = group
    ? allProducts.filter(p => group.ids.includes(p.id))
    : singleProduct ? [singleProduct] : [];

  const [selectedVariantId, setSelectedVariantId] = useState<string>("");

  // ── Scroll tout en haut à l'ouverture de la page ──
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  useEffect(() => {
    if (variants.length > 0 && !selectedVariantId) setSelectedVariantId(variants[0].id);
  }, [variants.length]);

  useEffect(() => {
    if (!group && !singleProduct && allProducts.length > 0) navigate("/");
  }, [group, singleProduct, allProducts.length]);

  const selectedVariant = variants.find(v => v.id === selectedVariantId) ?? variants[0];
  if (!selectedVariant) return null;

  const isOut = (selectedVariant.stock ?? 0) === 0;
  const heroImage = SOCIAL_IMAGES[selectedVariant.id] || selectedVariant.image || (group ? group.image : "");
  const pageTitle = group ? group.label : (t[selectedVariant.nameKey] || selectedVariant.nameKey);
  const pageCategory = group ? group.category : selectedVariant.columnId;
  const isSingleStreaming = !group && selectedVariant.columnId === "Social";

  const streamingFeatures = [
    t.streamingFeature1 || "Compte à vie — aucune expiration",
    t.streamingFeature2 || "100% sécurisé et vérifié par notre équipe",
    t.streamingFeature3 || "Livraison instantanée via ticket Discord",
    t.streamingFeature4 || "Accès mondial sans restriction géographique",
    t.streamingFeature5 || "Support Discord dédié disponible 24/7",
    t.streamingFeature6 || "Remplacement garanti en cas de problème",
  ];

  // Description du produit sélectionné
  const productDescription = t[selectedVariant.descKey] || selectedVariant.descKey || `${pageTitle} — qualité premium garantie.`;

  return (
    <div className="min-h-screen bg-[#030711] text-white">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-[-10%] w-[50%] h-[50%] bg-primary/8 blur-[180px] rounded-full" />
        <div className="absolute bottom-0 right-[-10%] w-[40%] h-[40%] bg-indigo-600/8 blur-[150px] rounded-full" />
      </div>

      <div className="relative z-10 container py-10 max-w-7xl mx-auto px-4">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-bold mb-10 group">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          {t.back || "Retour"}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">

          {/* ── LEFT ── */}
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="sticky top-24 space-y-4">
            <div className="aspect-[16/10] rounded-[2.5rem] overflow-hidden bg-white/[0.02] border border-white/[0.06] relative">
              <img src={heroImage} alt={pageTitle} className="w-full h-full object-cover" />
              <div className="absolute top-5 left-5 px-4 py-1.5 rounded-full bg-[#030711]/80 backdrop-blur-md border border-white/10 text-[10px] font-black text-white uppercase tracking-widest">
                {pageCategory}
              </div>
            </div>

            {/* Badges */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: <ShieldCheck className="w-4 h-4 text-primary" />, label: t.securePayments || "Sécurisé" },
                { icon: <Zap className="w-4 h-4 text-yellow-400" />, label: t.instantDelivery || "Instantané" },
                { icon: <Star className="w-4 h-4 text-indigo-400" />, label: t.topRatedService || "Communauté" },
              ].map((b, i) => (
                <div key={i} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center">
                  {b.icon}
                  <span className="text-[10px] font-bold text-slate-400">{b.label}</span>
                </div>
              ))}
            </div>

            {/* ── DESCRIPTION — sous les badges, côté gauche ── */}
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Description</p>
              {isSingleStreaming ? (
                <div className="space-y-2">
                  {streamingFeatures.map((f, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-300 font-medium">{f}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.p
                    key={selectedVariantId}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.2 }}
                    className="text-slate-300 text-sm leading-relaxed font-medium"
                  >
                    {productDescription}
                  </motion.p>
                </AnimatePresence>
              )}
            </div>
          </motion.div>

          {/* ── RIGHT ── */}
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="space-y-8">

            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-tight">{pageTitle}</h1>
              <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-bold ${isOut ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-green-500/10 border-green-500/30 text-green-400"}`}>
                <div className={`w-2 h-2 rounded-full ${isOut ? "bg-red-500" : "bg-green-500 animate-pulse"}`} />
                {isOut ? (t.outOfStock || "Out of Stock") : `${selectedVariant.stock} ${t.inStock || "in stock"}`}
              </div>
            </div>

            {/* ── PRIX PAR MÉTHODE — s'anime à chaque changement de variante ── */}
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                {t.paymentMethodLabel || "Prix par méthode de paiement"}
              </p>
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedVariantId}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-3"
                >
                  {PRICE_ROWS.map((row) => (
                    <div
                      key={row.id}
                      className={`flex items-center justify-between px-5 py-4 rounded-2xl border ${row.bg} ${row.border}`}
                    >
                      <span className={`font-black text-sm uppercase tracking-wider ${row.color}`}>
                        {row.label}
                      </span>
                      <span className="font-black text-xl text-white">
                        {row.getAmount(selectedVariant, settings.pscFeePercent)}
                      </span>
                    </div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* ── VARIANTES ── */}
            {group && variants.length > 1 && (
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t.variant || "Variante"}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {variants.map((v) => {
                    const isSelected = v.id === selectedVariantId;
                    const vOut = (v.stock ?? 0) === 0;
                    return (
                      <button key={v.id} onClick={() => setSelectedVariantId(v.id)}
                        className={`relative rounded-2xl overflow-hidden border-2 transition-all duration-200 text-left group ${isSelected ? "border-primary shadow-[0_0_20px_-5px_rgba(59,130,246,0.5)]" : "border-white/[0.08] hover:border-white/20"}`}>
                        <div className="aspect-[4/3] overflow-hidden relative">
                          <img src={SOCIAL_IMAGES[v.id] || v.image || group.image} alt={t[v.nameKey] || v.nameKey} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#030711] via-transparent to-transparent" />
                        </div>
                        <div className="p-3 bg-white/[0.02]">
                          <p className="text-xs font-black text-white leading-tight line-clamp-2 mb-1">{t[v.nameKey] || v.nameKey}</p>
                          <p className={`text-sm font-black ${isSelected ? "text-primary" : "text-slate-300"}`}>
                            à partir de €{v.pricePayPal.toFixed(2)}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                          </div>
                        )}
                        {vOut && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="text-[10px] font-black text-red-400 uppercase bg-[#030711]/80 px-2 py-1 rounded-full">{t.outOfStock || "Rupture"}</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── CTA DISCORD ── */}
            <div className="pt-2 space-y-3">
              <a href={DISCORD_TICKET} target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="w-full h-16 bg-[#5865F2] hover:bg-[#4752C4] text-white font-black text-lg rounded-2xl flex items-center justify-center gap-3 shadow-[0_0_40px_-10px_rgba(88,101,242,0.6)] transition-all hover:scale-[1.02] active:scale-[0.98]">
                  <DiscordIcon className="w-6 h-6 shrink-0" />
                  {t.openTicket || "Ouvrir un ticket Discord"}
                </Button>
              </a>
              <p className="text-center text-xs text-slate-600 font-medium">
                {t.discordTicketMsg || "Un agent vous répondra rapidement sur Discord"}
              </p>
            </div>

          </motion.div>
        </div>
      </div>
    </div>
  );
}
