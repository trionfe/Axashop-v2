import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/lib/translations';
import { ArrowLeft, CheckCircle2, Copy, AlertCircle, Clock, RefreshCcw, ExternalLink } from 'lucide-react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';
import ReviewModal from '@/components/ReviewModal';

declare global {
  interface Window {
    paypal?: any;
  }
}

export default function Checkout() {
  const { items, getTotalPrice, clearCart } = useCart();
  const { language } = useLanguage();
  const t = translations[language as keyof typeof translations] || translations.en;
  const [, navigate] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'paypal' | 'ltc' | 'paysafecard'>('paypal');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [paymentProof, setPaymentProof] = useState('');
  const [orderId, setOrderId] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [purchasedProducts, setPurchasedProducts] = useState<Array<{ id: number; name: string }>>([]);
  const [emailError, setEmailError] = useState<string | null>(null);

  useEffect(() => {
    const id = 'AXA-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    setOrderId(id);
  }, []);

  const totals = getTotalPrice();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copié dans le presse-papier');
  };

  const validateEmail = (email: string) => {
    if (!email) return (t as any).emailRequired || 'Veuillez entrer une adresse e-mail s\'il vous plaît';
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) return (t as any).invalidEmail || 'Email invalide (ex: exemple@gmail.com)';
    return null;
  };

  const submitPaymentMutation = trpc.submitManualPayment.useMutation({
    onSuccess: () => {
      setPaymentSuccess(true);
      toast.success('Votre commande est envoyée et sera traitée');
      setPurchasedProducts(items.map(item => ({ id: Number(item.productId), name: item.productName })));
      clearCart();
      setTimeout(() => {
        setShowReviewModal(true);
      }, 2000);
    },
    onError: (err) => {
      toast.error('Erreur lors de l\'envoi de la commande : ' + err.message);
    }
  });

  const capturePaypalMutation = trpc.capturePaypalOrder.useMutation({
    onSuccess: () => {
      setPaymentSuccess(true);
      toast.success('Paiement PayPal validé !');
      setPurchasedProducts(items.map(item => ({ id: Number(item.productId), name: item.productName })));
      clearCart();
      setTimeout(() => {
        setShowReviewModal(true);
      }, 2000);
    },
    onError: (err) => {
      toast.error('Erreur lors de la validation PayPal : ' + err.message);
    }
  });

  // Charger le SDK PayPal
  useEffect(() => {
    const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID || 'Ab8rNO85xRs7DqCkUMAgGXvFf4jsrcNh-uH6hRecXNjSPj5mYQ9dNE1KT4lMZ2FZY_fj23vmOMo-e7zt';
    if (selectedPaymentMethod === 'paypal' && !window.paypal) {
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=EUR`;
      script.async = true;
      script.onload = () => {
        renderPaypalButtons();
      };
      document.body.appendChild(script);
    } else if (selectedPaymentMethod === 'paypal' && window.paypal) {
      renderPaypalButtons();
    }
  }, [selectedPaymentMethod]);

  const renderPaypalButtons = () => {
    const container = document.getElementById('paypal-button-container');
    if (container && window.paypal) {
      container.innerHTML = '';
      window.paypal.Buttons({
        createOrder: (data: any, actions: any) => {
          const error = validateEmail(buyerEmail);
          if (error) {
            setEmailError(error);
            toast.error(error);
            return null;
          }
          return actions.order.create({
            purchase_units: [{
              amount: {
                currency_code: 'EUR',
                value: totals.paypal.toFixed(2)
              },
              description: `Commande Axa Shop ${orderId}`
            }]
          });
        },
        onApprove: async (data: any, actions: any) => {
          setIsProcessing(true);
          try {
            // Sauvegarder la commande en attente d'abord
            await submitPaymentMutation.mutateAsync({
              orderId,
              method: 'paypal',
              buyerName: "Client PayPal",
              buyerEmail,
              items: items.map(i => ({
                id: i.productId,
                name: i.productName,
                quantity: i.quantity,
                price: i.pricePayPal.toString()
              })),
              total: `€${totals.paypal.toFixed(2)}`,
              paymentProof: `PayPal Order ID: ${data.orderID}`
            });

            // Capturer le paiement côté serveur
            await capturePaypalMutation.mutateAsync({
              orderId: data.orderID,
              shopOrderId: orderId
            });
          } catch (e) {
            console.error(e);
          } finally {
            setIsProcessing(false);
          }
        }
      }).render('#paypal-button-container');
    }
  };

  const handlePayment = async () => {
    const error = validateEmail(buyerEmail);
    if (error) {
      setEmailError(error);
      toast.error(error);
      return;
    }
    
    if (selectedPaymentMethod === 'paysafecard' && !paymentProof) {
      toast.error('Veuillez fournir une preuve de paiement');
      return;
    }

    setEmailError(null);
    setIsProcessing(true);

    try {
      const totalStr = selectedPaymentMethod === 'ltc' 
        ? `${totals.ltc.toFixed(6)} LTC` 
        : `€${totals.psc.toFixed(2)}`;

      await submitPaymentMutation.mutateAsync({
        orderId,
        method: selectedPaymentMethod,
        buyerName: "Client",
        buyerEmail,
        items: items.map(i => ({
          id: i.productId,
          name: i.productName,
          quantity: i.quantity,
          price: selectedPaymentMethod === 'ltc' ? i.priceLTC.toString() : i.pricePSC.toString()
        })),
        total: totalStr,
        paymentProof
      });
    } catch (error: any) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  function LtcHistoryDisplay() {
    const { data: history, isLoading } = trpc.getLtcHistory.useQuery(undefined, {
      refetchInterval: 30000,
    });

    if (isLoading) {
      return (
        <div className="p-8 flex flex-col items-center justify-center gap-3">
          <RefreshCcw className="w-5 h-5 text-primary animate-spin" />
          <span className="text-[10px] text-slate-500 font-medium">Chargement de la blockchain...</span>
        </div>
      );
    }

    if (!history || history.length === 0) {
      return (
        <div className="p-8 text-center">
          <span className="text-[10px] text-slate-500">Aucune transaction récente trouvée.</span>
        </div>
      );
    }

    return (
      <div className="divide-y divide-white/5">
        {history.map((tx: any) => (
          <div key={tx.hash} className="p-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-slate-400 truncate w-24">{tx.hash}</span>
                <span className={cn(
                  "text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tighter",
                  tx.confirmations > 0 ? "bg-green-500/10 text-green-500" : "bg-orange-500/10 text-orange-500"
                )}>
                  {tx.confirmations > 0 ? `${tx.confirmations} Conf` : "En attente"}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {new Date(tx.received).toLocaleTimeString()}
              </span>
            </div>
            <div className="text-right flex flex-col items-end gap-1">
              <span className="text-[11px] font-black text-white">{(tx.total / 100000000).toFixed(6)} LTC</span>
              <a 
                href={`https://live.blockcypher.com/ltc/tx/${tx.hash}/`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[9px] text-primary hover:underline flex items-center gap-0.5"
              >
                Détails <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-[#030711] flex items-center justify-center p-4 pt-32">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-8 max-w-md">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }} className="w-24 h-24 rounded-3xl bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
          </motion.div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-white">Votre commande est envoyée et sera traitée</h1>
            <p className="text-slate-400">Votre commande <span className="text-white font-bold">{orderId}</span> est en cours de vérification. Vous recevrez vos produits dès validation du paiement.</p>
          </div>
          <Button onClick={() => navigate('/')} className="w-full h-12 bg-white/5 hover:bg-white/10 text-white font-black rounded-2xl">
            Retour à l'accueil
          </Button>
        </motion.div>
        
        {purchasedProducts.length > 0 && (
            <ReviewModal
            isOpen={showReviewModal}
            onClose={() => {
              setShowReviewModal(false);
              setTimeout(() => navigate('/'), 500);
            }}
            productId={purchasedProducts[0].id}
            productName={purchasedProducts[0].name}
            buyerName="Client"
            buyerEmail={buyerEmail}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030711] py-32">
      <div className="container max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
          <div className="space-y-2">
            <Button variant="ghost" onClick={() => navigate('/cart')} className="text-slate-400 hover:text-white mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour au panier
            </Button>
            <h1 className="text-4xl font-black text-white">Finaliser ma <span className="text-primary">Commande</span></h1>
            <p className="text-slate-400">ID Commande : <span className="text-white font-mono">{orderId}</span></p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="glass-card p-8 rounded-2xl border-white/[0.05] space-y-4">
                <h2 className="text-2xl font-black text-white mb-6">1. Vos Informations</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Adresse e-mail pour la livraison</label>
                    <Input 
                      type="email" 
                      placeholder="jean@example.com" 
                      value={buyerEmail} 
                      onChange={(e) => {
                        setBuyerEmail(e.target.value);
                        if (emailError) setEmailError(null);
                      }} 
                      className={cn(
                        "h-12 bg-white/[0.02] border-white/10 rounded-xl text-white",
                        emailError && "border-red-500 ring-1 ring-red-500"
                      )} 
                    />
                    {emailError && (
                      <p className="text-[10px] text-red-500 mt-1 font-bold">
                        {emailError}
                      </p>
                    )}
                    <p className="text-[10px] text-slate-400 mt-2">C'est à cette adresse que vous recevrez vos produits après validation.</p>
                  </div>
                </div>
              </div>

              <div className="glass-card p-8 rounded-2xl border-white/[0.05] space-y-4">
                <h2 className="text-2xl font-black text-white mb-6">2. Mode de paiement</h2>
                <div className="space-y-3">
                  {[
                    { id: 'paypal', label: 'PayPal', icon: '💳', amount: `€${totals.paypal.toFixed(2)}` },
                    { id: 'ltc', label: 'Litecoin', icon: 'Ł', amount: `${totals.ltc.toFixed(6)} LTC` },
                    { id: 'paysafecard', label: 'Paysafecard', icon: '🎫', amount: `€${totals.psc.toFixed(2)}` },
                  ].map((method) => (
                    <button key={method.id} onClick={() => { setSelectedPaymentMethod(method.id as any); setPaymentProof(''); }} className={`p-4 rounded-xl border-2 transition-all text-left w-full ${selectedPaymentMethod === method.id ? 'border-primary bg-primary/10' : 'border-white/10 bg-white/[0.02] hover:border-white/20'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{method.icon}</span>
                          <span className="font-black text-white">{method.label}</span>
                        </div>
                        <span className="text-lg font-black text-white">{method.amount}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="glass-card p-8 rounded-2xl border-white/[0.05] space-y-6">
                {selectedPaymentMethod === 'paypal' && (
                  <div className="space-y-4">
                    <div className="p-6 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-4">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="w-6 h-6 text-blue-500" />
                        <h3 className="text-xl font-black text-white">Paiement PayPal</h3>
                      </div>
                      <div className="space-y-3 text-sm text-slate-300">
                        <p>Pour régler votre commande via PayPal :</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          <li>Utilisez le bouton sécurisé ci-dessous</li>
                          <li>Connectez-vous à votre compte ou payez par carte</li>
                          <li>Une fois le paiement confirmé, ne fermez pas la page</li>
                          <li>Votre commande sera <span className="text-white font-bold">automatiquement</span> validée</li>
                        </ul>
                        <p className="text-[10px] bg-blue-500/10 p-2 rounded-lg border border-blue-500/20">
                          Note : En cas de problème, contactez le support avec votre ID de transaction PayPal.
                        </p>
                      </div>
                      <div id="paypal-button-container" className="min-h-[150px] py-4"></div>
                    </div>
                  </div>
                )}
                {selectedPaymentMethod === 'ltc' && (
                  <div className="space-y-4">
                    <div className="p-6 rounded-2xl bg-orange-500/10 border border-orange-500/20 space-y-4">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="w-6 h-6 text-orange-500" />
                        <h3 className="text-xl font-black text-white">Instructions Litecoin</h3>
                      </div>
                      <ul className="space-y-3 text-sm text-slate-300 list-disc list-inside">
                        <li>Envoyez le montant exact de LTC à l'adresse ci-dessous</li>
                        <li>Assurez-vous d'utiliser le réseau Litecoin (LTC) uniquement</li>
                        <li>Le système détecte <span className="text-white font-bold underline">automatiquement</span> votre paiement</li>
                        <li>La commande sera validée après 1 confirmation sur la blockchain</li>
                      </ul>
                      <div className="p-4 bg-black/20 rounded-xl border border-white/5 space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Montant à envoyer (LTC)</p>
                        <div className="flex items-center justify-between">
                          <span className="text-white font-bold">{totals.ltc.toFixed(6)} LTC</span>
                          <button onClick={() => copyToClipboard(totals.ltc.toFixed(6))} className="text-primary hover:text-primary/80"><Copy className="w-4 h-4" /></button>
                        </div>
                      </div>
                      <div className="p-4 bg-black/20 rounded-xl border border-white/5 space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Adresse Wallet LTC</p>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] sm:text-xs text-white font-mono break-all">LdM8wifnAMZwtMAjsq8caxrtXjYRfrf2nV</span>
                          <button onClick={() => copyToClipboard('LdM8wifnAMZwtMAjsq8caxrtXjYRfrf2nV')} className="text-primary hover:text-primary/80 flex-shrink-0"><Copy className="w-4 h-4" /></button>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Historique des dernières transactions</label>
                        <div className="flex items-center gap-1 text-[10px] text-green-500 font-bold animate-pulse">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                          VÉRIFICATION AUTO
                        </div>
                      </div>
                      
                      <div className="glass-card rounded-xl border-white/5 overflow-hidden">
                        <div className="p-3 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400">Transactions récentes sur le réseau</span>
                          <button onClick={() => window.location.reload()} className="text-[10px] text-primary hover:underline flex items-center gap-1">
                            <RefreshCcw className="w-3 h-3" /> Actualiser
                          </button>
                        </div>
                        <div className="max-h-[200px] overflow-y-auto">
                          <LtcHistoryDisplay />
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 text-center italic">Le système vérifie la blockchain toutes les 60 secondes pour valider votre commande.</p>
                    </div>
                  </div>
                )}
                {selectedPaymentMethod === 'paysafecard' && (
                  <div className="space-y-4">
                    <div className="p-6 rounded-2xl bg-green-500/10 border border-green-500/20 space-y-4">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="w-6 h-6 text-green-500" />
                        <h3 className="text-xl font-black text-white">Instructions importantes</h3>
                      </div>
                      <ul className="space-y-3 text-sm text-slate-300 list-disc list-inside">
                        <li>Achetez un ticket à un tabac ou une carte cadeau PaySafeCard dans un magasin</li>
                        <li>Ne rentrez <span className="text-white font-bold underline">JAMAIS</span> le code sur votre compte</li>
                        <li>Ne partagez le code avec personne d'autre</li>
                        <li>Envoyez le code directement en message</li>
                        <li>Toute carte utilisée ou invalide sera refusée</li>
                      </ul>
                      <div className="p-4 bg-black/20 rounded-xl border border-white/5 space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Montant du ticket requis</p>
                        <div className="flex items-center justify-between">
                          <span className="text-white font-bold">{totals.psc.toFixed(2)} €</span>
                          <button onClick={() => copyToClipboard(totals.psc.toFixed(2))} className="text-primary hover:text-primary/80"><Copy className="w-4 h-4" /></button>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Code PIN Paysafecard</label>
                      <Input placeholder="0000-0000-0000-0000" value={paymentProof} onChange={(e) => setPaymentProof(e.target.value)} className="h-12 bg-white/[0.02] border-white/10 rounded-xl text-white" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="glass-card p-8 rounded-2xl border-white/[0.05] sticky top-32">
                <h2 className="text-xl font-black text-white mb-6">Résumé</h2>
                <div className="space-y-4 mb-6">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between items-start gap-4 text-sm">
                      <span className="text-slate-400">{item.quantity}x {item.productName}</span>
                      <span className="text-white font-bold whitespace-nowrap text-right">
                        {selectedPaymentMethod === 'paypal' 
                          ? `€${(item.pricePayPal * item.quantity).toFixed(2)}` 
                          : selectedPaymentMethod === 'ltc' 
                          ? `${(item.priceLTC * item.quantity).toFixed(6)} LTC` 
                          : `€${(item.pricePSC * (1 + item.pscFeePercent / 100) * item.quantity).toFixed(2)}`}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t border-white/10 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-black">Total</span>
                    <span className="text-2xl font-black text-primary whitespace-nowrap">
                      {selectedPaymentMethod === 'paypal' 
                        ? `€${totals.paypal.toFixed(2)}` 
                        : selectedPaymentMethod === 'ltc' 
                        ? `${totals.ltc.toFixed(6)} LTC` 
                        : `€${totals.psc.toFixed(2)}`}
                    </span>
                  </div>
                  {selectedPaymentMethod !== 'paypal' && (
                    <div className="space-y-3">
                      <Button 
                        onClick={handlePayment} 
                        disabled={isProcessing}
                        className={cn(
                          "w-full h-14 font-black rounded-2xl shadow-lg transition-all duration-300",
                          selectedPaymentMethod === 'ltc' 
                            ? "bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20"
                            : "bg-primary hover:bg-primary/90 text-white shadow-primary/20"
                        )}
                      >
                        {isProcessing ? 'Traitement...' : selectedPaymentMethod === 'ltc' ? 'Vérifier mon paiement' : 'Confirmer le paiement'}
                      </Button>
                      
                      {selectedPaymentMethod === 'ltc' && (
                        <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-orange-500/5 border border-orange-500/10">
                          <RefreshCcw className="w-3 h-3 text-orange-500 animate-spin" />
                          <span className="text-[10px] text-orange-500/80 font-bold uppercase tracking-widest">Surveillance Blockchain active</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
