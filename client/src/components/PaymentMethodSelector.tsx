import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/lib/translations';
import { convertLTCToEUR } from '@/lib/priceConverter';

interface PaymentMethodSelectorProps {
  selectedMethod: 'paypal' | 'ltc' | 'paysafecard';
  onMethodChange: (method: 'paypal' | 'ltc' | 'paysafecard') => void;
  pricePayPal: number;
  priceLTC: number;
  pricePSC: number;
  pscFeePercent: number;
  paysafecardPin?: string;
  onPaysafecardPinChange?: (pin: string) => void;
}

export default function PaymentMethodSelector({
  selectedMethod,
  onMethodChange,
  pricePayPal,
  priceLTC,
  pricePSC,
  pscFeePercent,
  paysafecardPin = '',
  onPaysafecardPinChange,
}: PaymentMethodSelectorProps) {
  const [copiedText, setCopiedText] = useState(false);
  const [ltcPriceEUR, setLtcPriceEUR] = useState<number | null>(null);
  const { language } = useLanguage();
  const t = translations[language as keyof typeof translations] || translations.en;

  const pscTotalPrice = pricePSC * (1 + pscFeePercent / 100);

  useEffect(() => {
    const loadLTCPrice = async () => {
      try {
        const eurPrice = await convertLTCToEUR(priceLTC);
        setLtcPriceEUR(eurPrice);
      } catch (err) {
        console.error('Error converting LTC price:', err);
      }
    };

    loadLTCPrice();
  }, [priceLTC]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
          {(t as any).paymentMethodLabel || "Choisir le mode de paiement"}
        </p>

        <div className="space-y-2">
          {/* PayPal */}
          <button
            onClick={() => onMethodChange('paypal')}
            className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${
              selectedMethod === 'paypal'
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-white/10 bg-white/[0.02] hover:border-white/20'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <span className="text-lg">💳</span>
                </div>
                <div>
                  <p className="font-black text-white">PayPal</p>
                  <p className="text-[10px] text-slate-400">{(t as any).paypalSecurePayment || "Paiement sécurisé en ligne"}</p>
                </div>
              </div>
              <p className="text-2xl font-black text-white">€{pricePayPal.toFixed(2)}</p>
            </div>
          </button>

          {/* Litecoin */}
          <button
            onClick={() => onMethodChange('ltc')}
            className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${
              selectedMethod === 'ltc'
                ? 'border-orange-500 bg-orange-500/10'
                : 'border-white/10 bg-white/[0.02] hover:border-white/20'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                  <span className="text-lg">Ł</span>
                </div>
                <div>
                  <p className="font-black text-white">Litecoin</p>
                  <p className="text-[10px] text-slate-400">{(t as any).litecoinCrypto || "Crypto-monnaie décentralisée"}</p>
                </div>
              </div>
              <p className="text-2xl font-black text-white">{ltcPriceEUR !== null ? `€${ltcPriceEUR.toFixed(2)}` : '€...'}</p>
              <p className="text-[10px] text-slate-400">≈ {priceLTC.toFixed(8)} LTC</p>
            </div>
          </button>

          {/* Paysafecard */}
          <button
            onClick={() => onMethodChange('paysafecard')}
            className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${
              selectedMethod === 'paysafecard'
                ? 'border-green-500 bg-green-500/10'
                : 'border-white/10 bg-white/[0.02] hover:border-white/20'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <span className="text-lg">🎫</span>
                </div>
                <div>
                  <p className="font-black text-white">Paysafecard</p>
                  <p className="text-[10px] text-slate-400">{(t as any).paysafecardPrepaid || "Code prépayé en magasin"}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-white">€{pscTotalPrice.toFixed(2)}</p>
                <p className="text-[10px] text-green-400">+{pscFeePercent}% {(t as any).pscFeeLabel || "frais"}</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Conditional Content */}
      <AnimatePresence mode="wait">
        {selectedMethod === 'paypal' && (
          <motion.div
            key="paypal-section"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 border-t border-white/10 pt-6"
          >
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 space-y-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="font-black text-white text-sm">{(t as any).paypalInstructions || "Instructions PayPal"}</p>
                  <ul className="text-[10px] text-slate-300 space-y-1">
                    <li>• {(t as any).paypalInstructionsText1 || "Envoyez le montant exact en utilisant l'option 'Entre proches'"}</li>
                    <li>• {(t as any).paypalInstructionsText2 || "N'ajoutez aucune note lors du transfert"}</li>
                    <li>• {(t as any).paypalInstructionsText3 || "Le paiement sera vérifié manuellement par notre équipe"}</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                {(t as any).sendPaymentTo || "Envoyer le paiement à"}
              </p>
              <div className="flex items-center justify-between bg-white/[0.02] border border-white/10 rounded-xl p-3">
                <span className="text-sm font-mono text-white">gerarbarbier17@gmail.com</span>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => copyToClipboard('gerarbarbier17@gmail.com')}
                  className="text-slate-400 hover:text-white"
                >
                  {copiedText ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {selectedMethod === 'ltc' && (
          <motion.div
            key="ltc-section"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 border-t border-white/10 pt-6"
          >
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4 space-y-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="font-black text-white text-sm">{(t as any).litecoinInstructions || "Instructions Litecoin"}</p>
                  <ul className="text-[10px] text-slate-300 space-y-1">
                    <li>• {(t as any).litecoinInstructionsText1 || "Envoyez le montant exact de LTC à l'adresse ci-dessous"}</li>
                    <li>• {(t as any).litecoinInstructionsText2 || "Utilisez uniquement le réseau Litecoin (LTC)"}</li>
                    <li>• {(t as any).litecoinInstructionsText3 || "La commande sera validée après 1 confirmation blockchain"}</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                {(t as any).walletAddress || "Adresse Wallet LTC"}
              </p>
              <div className="flex items-center justify-between bg-white/[0.02] border border-white/10 rounded-xl p-3 gap-2">
                <span className="text-[10px] font-mono text-white break-all">LdM8wifnAMZwtMAjsq8caxrtXjYRfrf2nV</span>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => copyToClipboard('LdM8wifnAMZwtMAjsq8caxrtXjYRfrf2nV')}
                  className="text-slate-400 hover:text-white flex-shrink-0"
                >
                  {copiedText ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {selectedMethod === 'paysafecard' && (
          <motion.div
            key="paysafecard-section"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 border-t border-white/10 pt-6"
          >
            {/* Instructions */}
            <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 space-y-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="font-black text-white text-sm">{(t as any).paysafecardInstructions || "Instructions importantes"}</p>
                  <ul className="text-[10px] text-slate-300 space-y-1">
                    <li>• {(t as any).paysafecardInstructionsText1 || "Achetez un ticket à un tabac ou une carte cadeau PaySafeCard dans un magasin"}</li>
                    <li>• {(t as any).paysafecardInstructionsText2 || "Ne rentrez JAMAIS le code sur votre compte"}</li>
                    <li>• {(t as any).paysafecardInstructionsText3 || "Ne partagez le code avec personne d'autre"}</li>
                    <li>• {(t as any).paysafecardInstructionsText4 || "Envoyez le code directement en message"}</li>
                    <li>• {(t as any).paysafecardInstructionsText5 || "Toute carte utilisée ou invalide sera refusée"}</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Code Input */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">
                {(t as any).paysafecardPin || "Code PIN Paysafecard (16 chiffres)"}
              </label>
              <Input
                type="password"
                placeholder={(t as any).paysafecardPinPlaceholder || "0000 0000 0000 0000"}
                value={paysafecardPin}
                onChange={(e) => onPaysafecardPinChange?.(e.target.value.replace(/\s/g, ''))}
                maxLength={16}
                className="bg-white/[0.02] border-white/10 rounded-xl text-white font-mono tracking-widest"
              />
              <p className="text-[10px] text-slate-400 mt-2">
                {(t as any).paysafecardPinDesc || "Votre code sera envoyé de manière sécurisée à notre équipe pour validation."}
              </p>
            </div>

            {/* Admin Email */}
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                {(t as any).sendCodeTo || "Envoyer le code à"}
              </p>
              <div className="flex items-center justify-between bg-white/[0.02] border border-white/10 rounded-xl p-3">
                <span className="text-sm font-mono text-white">gerarbarbier17@gmail.com</span>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => copyToClipboard('gerarbarbier17@gmail.com')}
                  className="text-slate-400 hover:text-white"
                >
                  {copiedText ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
