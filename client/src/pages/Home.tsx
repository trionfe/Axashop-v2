import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Zap, Lock, Star, ArrowRight, Search, Layers, ShoppingCart, Plus, Minus, X, CreditCard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";
import { getProducts, getSettings } from "@/lib/products";
import { useCart } from "@/contexts/CartContext";
import PaymentMethodSelector from "@/components/PaymentMethodSelector";

import { useLocation } from "wouter";
import { toast } from "sonner";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: "circOut" as const
    }
  }
};

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("All");
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const { language } = useLanguage();
  const t = translations[language as keyof typeof translations] || translations.en;
  const { addToCart } = useCart();
  const settings = getSettings();
  const [, navigate] = useLocation();
  const [productPaymentMethods, setProductPaymentMethods] = useState<Record<string, { method: 'paypal' | 'ltc' | 'paysafecard'; email?: string; pin?: string; quantity: number }>>({});


  useEffect(() => {
    setProducts(getProducts());
  }, []);

  // Extraction dynamique des catégories uniques à partir des produits
  const categories = ["All", ...Array.from(new Set(products.map((p: any) => p.columnId.toString())))];

  const filteredProducts = products.filter((product: any) => {
    const name = (t as any)[product.nameKey] || product.nameKey;
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         product.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag === "All" || product.columnId === selectedTag;
    return matchesSearch && matchesTag;
  });

  const handleAddToCart = (product: any, silent = false) => {
    const state = productPaymentMethods[product.id] || { method: 'paypal', quantity: 1 };
    const { method, email, pin } = state;

    // Validation
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

    if (!silent) {
      toast.success((t as any).addedToCart || 'Ajouté au panier !');
    }

    // Réinitialiser
    setProductPaymentMethods(prev => ({
      ...prev,
      [product.id]: { method: 'paypal', quantity: 1 }
    }));
    setExpandedProductId(null);
  };

  const handleBuyNow = (product: any) => {
    handleAddToCart(product, true);
    navigate('/checkout');
  };

  const scrollToStore = () => {
    const storeSection = document.getElementById('store');
    if (storeSection) {
      storeSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full bg-[#030711] overflow-x-hidden relative">
      {/* Background with Glass Effect */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Upper part: Original Dark Background */}
        <div className="absolute top-0 w-full h-[450px] bg-[#030711]" />
        
        {/* Lower part: Glassmorphism / iOS Blur Effect */}
        <div className="absolute top-[450px] bottom-0 w-full bg-white/[0.01] backdrop-blur-[20px]" />
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden z-10">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[150px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[130px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
          <div className="absolute top-[40%] right-[10%] w-[30%] h-[30%] bg-indigo-600/5 blur-[100px] rounded-full" />
        </div>

        <div className="container relative z-10">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="max-w-5xl mx-auto text-center space-y-10"
          >
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

            {/* Trust Indicators */}
            <motion.div variants={itemVariants} className="pt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { icon: <ShieldCheck className="w-6 h-6 text-primary" />, label: (t as any).securePayments || "Paiements Sécurisés" },
                { icon: <Zap className="w-6 h-6 text-primary" />, label: (t as any).instantDelivery || "Livraison Instantanée" },
                { icon: <Lock className="w-6 h-6 text-primary" />, label: (t as any).encryptedData || "Données Chiffrées" },
                { icon: <Star className="w-6 h-6 text-primary" />, label: (t as any).topRatedService || "Service Mieux Noté" }
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl bg-white/[0.05] border border-white/10 backdrop-blur-sm hover:bg-white/[0.08] transition-all group">
                  <div className="p-3 rounded-xl bg-primary/10 group-hover:scale-110 transition-transform">
                    {item.icon}
                  </div>
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

              {/* Search and Filter */}
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
              {filteredProducts.map((product: any, index: number) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  className="group bg-white/[0.02] border border-white/[0.05] rounded-[2rem] overflow-hidden hover:border-primary/30 transition-all duration-500 flex flex-col h-full"
                >
                  {/* Image Container */}
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
                      {product.stock || 0} {(t as any).inStock || "in stock"}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-8 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold text-white leading-tight group-hover:text-primary transition-colors">
                        {(t as any)[product.nameKey] || product.nameKey}
                      </h3>
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed mb-8 line-clamp-2 font-medium">
                      {(t as any)[product.descKey] || product.descKey}
                    </p>
                    
                    {/* Prix Multi-Paiement */}
                    <div className="mt-auto pt-6 border-t border-white/[0.05] space-y-4">
                      <div className="flex flex-col gap-2">
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 flex justify-between items-center">
                          <p className="text-xs font-black text-blue-400 uppercase tracking-tighter">PayPal</p>
                          <p className="text-base font-black text-white whitespace-nowrap">€{product.pricePayPal.toFixed(2)}</p>
                        </div>
                        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3 flex justify-between items-center">
                          <p className="text-xs font-black text-orange-400 uppercase tracking-tighter">LTC</p>
                          <p className="text-base font-black text-white whitespace-nowrap">€{product.pricePayPal.toFixed(2)}</p>
                        </div>
                        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 flex justify-between items-center">
                          <p className="text-xs font-black text-green-400 uppercase tracking-tighter">PSC</p>
                          <p className="text-base font-black text-white whitespace-nowrap">€{(product.pricePSC * (1 + settings.pscFeePercent / 100)).toFixed(2)}</p>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handleAddToCart(product)}
                          className="flex-1 h-12 bg-white/[0.05] hover:bg-white/[0.1] text-white font-black rounded-2xl transition-all border border-white/10"
                          title={(t as any).addToCart || "Ajouter au panier"}
                        >
                          <ShoppingCart className="w-4 h-4" />
                        </Button>
                        <Button 
                          onClick={() => handleBuyNow(product)}
                          className="flex-[3] h-12 bg-primary hover:bg-primary/90 text-white font-black rounded-2xl transition-all shadow-lg shadow-primary/20"
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          {(t as any).buyNow || "Acheter"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Empty State */}
            {filteredProducts.length === 0 && (
              <div className="text-center py-40 glass-card rounded-[3rem] border-dashed border-white/10">
                <Search className="w-16 h-16 text-slate-700 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-white mb-2">{(t as any).noProductsFound || "Aucun produit trouvé"}</h3>
                <p className="text-slate-500">{(t as any).tryAdjustingSearch || "Essayez d'ajuster votre recherche ou vos filtres."}</p>
                <Button 
                  variant="link" 
                  className="mt-4 text-primary font-bold"
                  onClick={() => { setSearchQuery(""); setSelectedTag("All"); }}
                >
                  {(t as any).clearFilters || "Effacer les filtres"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Expanded Product Modal */}
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
                        <h2 className="text-3xl font-black text-white mb-2">
                          {(t as any)[product.nameKey] || product.nameKey}
                        </h2>
                        <p className="text-slate-400">
                          {(t as any)[product.descKey] || product.descKey}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setExpandedProductId(null);
                        }}
                        className="text-slate-400 hover:text-white"
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </div>

                    {/* Payment Method Selector */}
                    <PaymentMethodSelector
                      selectedMethod={state.method}
                      onMethodChange={(method) => {
                        setProductPaymentMethods(prev => ({
                          ...prev,
                          [product.id]: { ...state, method }
                        }));
                      }}
                      pricePayPal={product.pricePayPal}
                      priceLTC={product.priceLTC}
                      pricePSC={product.pricePSC}
                      pscFeePercent={settings.pscFeePercent}
                      paysafecardPin={state.pin}
                      onPaysafecardPinChange={(pin) => {
                        setProductPaymentMethods(prev => ({
                          ...prev,
                          [product.id]: { ...state, pin }
                        }));
                      }}
                    />

                    {/* Quantity Selector */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Quantité</p>
                      <div className="flex items-center gap-4 bg-white/[0.02] border border-white/10 rounded-2xl p-4 w-fit">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setProductPaymentMethods(prev => ({
                              ...prev,
                              [product.id]: { ...state, quantity: Math.max(1, state.quantity - 1) }
                            }));
                          }}
                          className="text-slate-400 hover:text-white"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="text-2xl font-black text-white w-12 text-center">{state.quantity}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setProductPaymentMethods(prev => ({
                              ...prev,
                              [product.id]: { ...state, quantity: state.quantity + 1 }
                            }));
                          }}
                          className="text-slate-400 hover:text-white"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-6 border-t border-white/10">
                      <Button
                        onClick={() => handleAddToCart(product)}
                        className="flex-1 h-14 bg-white/[0.05] hover:bg-white/[0.1] text-white font-black rounded-2xl border border-white/10"
                      >
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        {(t as any).addToCart || "Ajouter au panier"}
                      </Button>
                      <Button
                        onClick={() => handleBuyNow(product)}
                        className="flex-1 h-14 bg-primary hover:bg-primary/90 text-white font-black rounded-2xl"
                      >
                        <CreditCard className="w-5 h-5 mr-2" />
                        {(t as any).buyNow || "Acheter maintenant"}
                      </Button>
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
              {
                title: (t as any).featureSecure || "Sécurisé",
                desc: (t as any).featureSecureDesc || "Vos données sont chiffrées et jamais partagées.",
                icon: <ShieldCheck className="w-8 h-8 text-primary" />
              },
              {
                title: (t as any).featureInstant || "Instantané",
                desc: (t as any).featureInstantDesc || "Recevez vos produits immédiatement après l'achat.",
                icon: <Zap className="w-8 h-8 text-blue-400" />
              },
              {
                title: (t as any).featureSupport || "Support",
                desc: (t as any).featureSupportDesc || "Une équipe dédiée pour vous aider 24/7.",
                icon: <Star className="w-8 h-8 text-indigo-400" />
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="glass-card p-10 rounded-[2.5rem] border-white/[0.05] hover:border-white/10 transition-all group"
              >
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
