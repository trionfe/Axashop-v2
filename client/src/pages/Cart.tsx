import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/lib/translations';
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';

export default function Cart() {
  const { items, removeFromCart, updateQuantity, getTotalPrice } = useCart();
  const { language } = useLanguage();
  const t = translations[language as keyof typeof translations] || translations.en;
  const [, navigate] = useLocation();
  const [removingId, setRemovingId] = useState<string | null>(null);

  const totals = getTotalPrice();

  const handleRemove = (itemId: string) => {
    setRemovingId(itemId);
    setTimeout(() => {
      removeFromCart(itemId);
      setRemovingId(null);
    }, 300);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#030711] flex items-center justify-center p-4 pt-32">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-8 max-w-md"
        >
          <div className="w-24 h-24 rounded-3xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mx-auto">
            <ShoppingCart className="w-12 h-12 text-slate-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-white">Panier vide</h1>
            <p className="text-slate-400">Vous n'avez pas encore ajouté de produits à votre panier.</p>
          </div>
          <Button
            onClick={() => navigate('/')}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-black rounded-2xl"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Continuer vos achats
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030711] py-20 md:py-32">
      <div className="container max-w-6xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8 md:space-y-10"
        >
          {/* Header */}
          <div className="space-y-2">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="text-slate-400 hover:text-white mb-2 md:mb-4 -ml-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour au catalogue
            </Button>
            <h1 className="text-3xl md:text-4xl font-black text-white">
              Votre <span className="text-primary">Panier</span>
            </h1>
            <p className="text-sm md:text-base text-slate-400">
              {items.length} article{items.length > 1 ? 's' : ''} dans votre panier
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              <AnimatePresence mode="popLayout">
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`glass-card p-4 md:p-6 rounded-2xl border-white/[0.05] transition-all ${
                      removingId === item.id ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row gap-4 md:gap-6 relative">
                      {/* Product Image */}
                      <div className="w-full sm:w-24 h-48 sm:h-24 rounded-xl overflow-hidden flex-shrink-0 bg-white/[0.02] border border-white/10">
                        <img
                          src={item.productImage}
                          alt={item.productName}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-bold text-white truncate pr-8 sm:pr-0">{item.productName}</h3>
                          {/* Mobile Delete Button */}
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleRemove(item.id)}
                            className="text-red-400 hover:bg-red-400/10 h-8 w-8 absolute right-0 top-0 sm:hidden"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <div className="space-y-1 text-sm">
                          <p className="text-slate-400">
                            Mode de paiement:{' '}
                            <span className="text-white font-semibold">
                              {item.paymentMethod === 'paypal'
                                ? 'PayPal'
                                : item.paymentMethod === 'ltc'
                                ? 'Litecoin'
                                : 'Paysafecard'}
                            </span>
                          </p>
                          {item.buyerEmail && (
                            <p className="text-slate-400 truncate">
                              E-mail: <span className="text-white font-semibold">{item.buyerEmail}</span>
                            </p>
                          )}
                        </div>

                        {/* Mobile Price & Quantity */}
                        <div className="flex items-center justify-between mt-4 sm:hidden">
                           <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                              Prix unitaire
                            </p>
                            <p className="text-xl font-black text-white">
                              {item.paymentMethod === 'paypal'
                                ? `€${item.pricePayPal.toFixed(2)}`
                                : item.paymentMethod === 'ltc'
                                ? `${item.priceLTC.toFixed(6)} LTC`
                                : `€${(item.pricePSC * (1 + item.pscFeePercent / 100)).toFixed(2)}`}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2 bg-white/[0.02] border border-white/10 rounded-xl p-1.5">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                              className="text-slate-400 hover:text-white h-7 w-7"
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="text-sm font-black text-white w-5 text-center">
                              {item.quantity}
                            </span>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="text-slate-400 hover:text-white h-7 w-7"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Desktop Price & Quantity */}
                      <div className="hidden sm:flex flex-col text-right space-y-4 min-w-[120px]">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                            Prix unitaire
                          </p>
                          <p className="text-2xl font-black text-white">
                            {item.paymentMethod === 'paypal'
                              ? `€${item.pricePayPal.toFixed(2)}`
                              : item.paymentMethod === 'ltc'
                              ? `${item.priceLTC.toFixed(6)} LTC`
                              : `€${(item.pricePSC * (1 + item.pscFeePercent / 100)).toFixed(2)}`}
                          </p>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2 bg-white/[0.02] border border-white/10 rounded-xl p-2 w-fit ml-auto">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                            className="text-slate-400 hover:text-white h-8 w-8"
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="text-sm font-black text-white w-6 text-center">
                            {item.quantity}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="text-slate-400 hover:text-white h-8 w-8"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Desktop Delete Button */}
                      <div className="hidden sm:block">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRemove(item.id)}
                          className="text-red-400 hover:bg-red-400/10 h-10 w-10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Summary Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-6 md:p-8 rounded-2xl border-white/[0.05] h-fit lg:sticky lg:top-32"
            >
              <h2 className="text-2xl font-black text-white mb-6">Résumé</h2>

              {/* Price Breakdown */}
              <div className="space-y-4 mb-8 pb-8 border-b border-white/10">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">PayPal (EUR)</span>
                  <span className="text-lg font-black text-white">€{totals.paypal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Litecoin (LTC)</span>
                  <span className="text-lg font-black text-white">{totals.ltc.toFixed(6)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Paysafecard (EUR)</span>
                  <span className="text-lg font-black text-white">€{totals.psc.toFixed(2)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <Button
                onClick={() => navigate('/checkout')}
                className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-black rounded-2xl mb-4 shadow-lg shadow-primary/20"
              >
                Procéder au paiement
              </Button>

              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="w-full h-12 border-white/10 text-white hover:bg-white/5 font-black rounded-2xl"
              >
                Continuer vos achats
              </Button>

              {/* Info */}
              <p className="text-[10px] text-slate-500 mt-6 text-center leading-relaxed">
                Les prix sont affichés pour chaque mode de paiement. Vous pourrez choisir votre méthode de paiement au checkout.
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
