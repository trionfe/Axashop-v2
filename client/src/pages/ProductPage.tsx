import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";
import { getProducts, getSettings } from "@/lib/products";

// ─── Même définition des groupes que Home.tsx ─────────────────────────────────
export const PRODUCT_GROUPS: Record<string, {
  label: string;
  category: string;
  image: string;
  ids: string[];
}> = {
  "group-accounts": {
    label: "Compte Discord",
    category: "Accounts",
    image: "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=800&auto=format&fit=crop&q=60",
    ids: ["acc-2025-account","acc-2024-account","acc-2023-account","acc-2022-account","acc-2021-account","acc-2020-account","acc-2019-account","acc-2018-account","acc-2017-account","acc-2016-account","acc-2015-account"],
  },
  "group-discord-deco": {
    label: "Décoration Discord",
    category: "Discord",
    image: "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=800&auto=format&fit=crop&q=60",
    ids: ["deco-discord-decoration-4.99€","deco-discord-decoration-5.99€","deco-discord-decoration-6.99€","deco-discord-decoration-7.99€","deco-discord-decoration-8.49€","deco-discord-decoration-9.99€","deco-discord-decoration-11.99€","deco-random-décoration"],
  },
  "group-netflix": {
    label: "Netflix",
    category: "Social",
    image: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=800&auto=format&fit=crop&q=60",
    ids: ["social-netflix-no-ads","social-netflix-4k","social-netflix-random"],
  },
  "group-prime-video": {
    label: "Prime Video",
    category: "Social",
    image: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=800&auto=format&fit=crop&q=60",
    ids: ["social-prime-video-lifetime","social-prime-video-6months","social-prime-video-1month"],
  },
  "group-youtube": {
    label: "YouTube Premium",
    category: "Social",
    image: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=800&auto=format&fit=crop&q=60",
    ids: ["social-youtube-premium-lifetime-fa","social-youtube-premium-family-owner-lifetime-fa"],
  },
  "group-chatgpt": {
    label: "ChatGPT",
    category: "Social",
    image: "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&auto=format&fit=crop&q=60",
    ids: ["social-chatgpt-plus-fa-1month","social-chatgpt-go-fa-1year"],
  },
  "group-streaming-plus": {
    label: "Streaming+",
    category: "Social",
    image: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=800&auto=format&fit=crop&q=60",
    ids: ["social-hbo-max","social-disney+-lifetime","social-crunchyroll-lifetime-[megafan]","social-paramount+-lifetime"],
  },
};

// ─── Discord ticket URL ────────────────────────────────────────────────────────
const DISCORD_TICKET = "https://discord.com/channels/1476550378987454534/1476973014460530718";

const DiscordIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 11.747 11.747 0 0 0-.617-1.25.077.077 0 0 0-.079-.037 19.736 19.736 0 0 0-4.885 1.515.069.069 0 0 0-.032.027C.533 9.048-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.419-2.157 2.419z"/>
  </svg>
);

// ─── Méthodes de paiement ──────────────────────────────────────────────────────
type PayMethod = "paypal" | "ltc" | "psc";

const PAY_METHODS: { id: PayMethod; label: string; color: string; border: string; bg: string }[] = [
  { id: "paypal", label: "PayPal",      color: "text-blue-400",   border: "border-blue-500/40",   bg: "bg-blue-500/10" },
  { id: "ltc",    label: "Litecoin",    color: "text-orange-400", border: "border-orange-500/40", bg: "bg-orange-500/10" },
  { id: "psc",    label: "Paysafecard", color: "text-green-400",  border: "border-green-500/40",  bg: "bg-green-500/10" },
];

function getPrice(product: any, method: PayMethod, pscFee: number): string {
  if (method === "paypal") return `€${product.pricePayPal.toFixed(2)}`;
  if (method === "ltc")    return `€${product.pricePayPal.toFixed(2)}`;
  return `€${(product.pricePSC * (1 + pscFee / 100)).toFixed(2)}`;
}

// ─── PAGE ──────────────────────────────────────────────────────────────────────
export default function ProductPage() {
  const params = useParams<{ groupId: string }>();
  const [, navigate] = useLocation();
  const { language } = useLanguage();
  const t = (translations[language as keyof typeof translations] || translations.en) as any;
  const settings = getSettings();
  const allProducts = getProducts();

  const groupId = params.groupId;
  const group = PRODUCT_GROUPS[groupId];

  // Redirect if group not found
  useEffect(() => {
    if (!group) navigate("/");
  }, [group]);

  const variants = allProducts.filter(p => group?.ids.includes(p.id));

  const [selectedVariantId, setSelectedVariantId] = useState<string>(variants[0]?.id ?? "");
  const [selectedMethod, setSelectedMethod]       = useState<PayMethod>("paypal");
  const [quantity, setQuantity]                   = useState(1);

  const selectedVariant = variants.find(v => v.id === selectedVariantId) ?? variants[0];

  if (!group || !selectedVariant) return null;

  const isOut = (selectedVariant.stock ?? 0) === 0;
  const currentPrice = getPrice(selectedVariant, selectedMethod, settings.pscFeePercent);

  return (
    <div className="min-h-screen bg-[#030711] text-white">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-[-10%] w-[50%] h-[50%] bg-primary/8 blur-[180px] rounded-full" />
        <div className="absolute bottom-0 right-[-10%] w-[40%] h-[40%] bg-indigo-600/8 blur-[150px] rounded-full" />
      </div>

      <div className="relative z-10 container py-10 max-w-7xl mx-auto px-4">

        {/* Back button */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-bold mb-10 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          {t.back || "Retour"}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">

          {/* ── LEFT : image principale ── */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="sticky top-24 space-y-4"
          >
            <div className="aspect-square rounded-[2.5rem] overflow-hidden bg-white/[0.02] border border-white/[0.06] relative">
              <img
                src={selectedVariant.image || group.image}
                alt={t[selectedVariant.nameKey] || selectedVariant.nameKey}
                className="w-full h-full object-cover"
              />
              {/* Category badge */}
              <div className="absolute top-5 left-5 px-4 py-1.5 rounded-full bg-[#030711]/80 backdrop-blur-md border border-white/10 text-[10px] font-black text-white uppercase tracking-widest">
                {group.category}
              </div>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
                <span className="text-xs font-bold text-slate-300">{t.securePayments || "Paiement sécurisé"}</span>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                <Zap className="w-5 h-5 text-yellow-400 shrink-0" />
                <span className="text-xs font-bold text-slate-300">{t.instantDelivery || "Livraison instantanée"}</span>
              </div>
            </div>
          </motion.div>

          {/* ── RIGHT : infos produit ── */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-8"
          >
            {/* Titre + stock */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-tight">
                {group.label}
              </h1>
              <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-bold ${
                isOut
                  ? "bg-red-500/10 border-red-500/30 text-red-400"
                  : "bg-green-500/10 border-green-500/30 text-green-400"
              }`}>
                <div className={`w-2 h-2 rounded-full ${isOut ? "bg-red-500" : "bg-green-500 animate-pulse"}`} />
                {isOut
                  ? (t.outOfStock || "Out of Stock")
                  : `${selectedVariant.stock} ${t.inStock || "in stock"}`
                }
              </div>
            </div>

            {/* Prix actuel */}
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                {t.currentPrice || "Prix actuel"}
              </p>
              <AnimatePresence mode="wait">
                <motion.p
                  key={`${selectedVariantId}-${selectedMethod}`}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="text-5xl font-black text-primary"
                >
                  {currentPrice}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Sélecteur variantes */}
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                {t.variant || "Variante"}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {variants.map((v) => {
                  const isSelected = v.id === selectedVariantId;
                  const vOut = (v.stock ?? 0) === 0;
                  const vPrice = getPrice(v, selectedMethod, settings.pscFeePercent);
                  return (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariantId(v.id)}
                      className={`relative rounded-2xl overflow-hidden border-2 transition-all duration-200 text-left group ${
                        isSelected
                          ? "border-primary shadow-[0_0_20px_-5px_rgba(59,130,246,0.5)]"
                          : "border-white/[0.08] hover:border-white/20"
                      }`}
                    >
                      {/* Miniature image */}
                      <div className="aspect-[4/3] overflow-hidden">
                        <img
                          src={v.image || group.image}
                          alt={t[v.nameKey] || v.nameKey}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#030711] via-transparent to-transparent" />
                      </div>
                      {/* Infos */}
                      <div className="p-3 bg-white/[0.02]">
                        <p className="text-xs font-black text-white leading-tight line-clamp-2 mb-1">
                          {t[v.nameKey] || v.nameKey}
                        </p>
                        <p className={`text-sm font-black ${isSelected ? "text-primary" : "text-slate-300"}`}>
                          {vPrice}
                        </p>
                      </div>
                      {/* Selected indicator */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      {/* Out of stock overlay */}
                      {vOut && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-[10px] font-black text-red-400 uppercase tracking-widest bg-[#030711]/80 px-2 py-1 rounded-full">
                            {t.outOfStock || "Rupture"}
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Méthodes de paiement (radio) */}
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                {t.paymentMethodLabel || "Méthode de paiement"}
              </p>
              <div className="flex flex-col gap-3">
                {PAY_METHODS.map((method) => {
                  const price = getPrice(selectedVariant, method.id, settings.pscFeePercent);
                  const isActive = selectedMethod === method.id;
                  return (
                    <button
                      key={method.id}
                      onClick={() => setSelectedMethod(method.id)}
                      className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-200 ${
                        isActive
                          ? `${method.bg} ${method.border} shadow-lg`
                          : "bg-white/[0.02] border-white/[0.08] hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Radio indicator */}
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          isActive ? `${method.border} ${method.bg}` : "border-white/20"
                        }`}>
                          {isActive && <div className={`w-2.5 h-2.5 rounded-full ${
                            method.id === "paypal" ? "bg-blue-400" :
                            method.id === "ltc"    ? "bg-orange-400" : "bg-green-400"
                          }`} />}
                        </div>
                        <span className={`font-black text-sm ${isActive ? method.color : "text-slate-400"}`}>
                          {method.label}
                        </span>
                      </div>
                      <span className={`font-black text-lg ${isActive ? "text-white" : "text-slate-400"}`}>
                        {price}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantité */}
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                {t.quantity || "Quantité"}
              </p>
              <div className="flex items-center gap-4 bg-white/[0.02] border border-white/[0.08] rounded-2xl p-2 w-fit">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-10 h-10 rounded-xl bg-white/[0.05] hover:bg-white/[0.10] text-white font-black text-xl flex items-center justify-center transition-all"
                >
                  −
                </button>
                <span className="text-2xl font-black text-white w-12 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => q + 1)}
                  className="w-10 h-10 rounded-xl bg-white/[0.05] hover:bg-white/[0.10] text-white font-black text-xl flex items-center justify-center transition-all"
                >
                  +
                </button>
              </div>
            </div>

            {/* CTA */}
            <div className="pt-2">
              <a href={DISCORD_TICKET} target="_blank" rel="noopener noreferrer">
                <Button
                  size="lg"
                  className="w-full h-16 bg-[#5865F2] hover:bg-[#4752C4] text-white font-black text-lg rounded-2xl flex items-center justify-center gap-3 shadow-[0_0_40px_-10px_rgba(88,101,242,0.6)] transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <DiscordIcon className="w-6 h-6 shrink-0" />
                  {t.openTicket || "Ouvrir un ticket Discord"}
                </Button>
              </a>
              <p className="text-center text-xs text-slate-600 mt-3 font-medium">
                {t.discordTicketMsg || "Un agent vous répondra rapidement sur Discord"}
              </p>
            </div>

            {/* Description */}
            {selectedVariant.descKey && (
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Description</p>
                <p className="text-slate-300 text-sm leading-relaxed font-medium">
                  {t[selectedVariant.descKey] || selectedVariant.descKey}
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
