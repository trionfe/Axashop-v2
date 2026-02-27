import { useState, useEffect } from 'react';
import { convertLTCToEUR, getCachedLTCRate } from '@/lib/priceConverter';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/lib/translations';

interface LTCPriceDisplayProps {
  priceLTC: number;
  className?: string;
  showLTCAmount?: boolean;
}

export default function LTCPriceDisplay({
  priceLTC,
  className = '',
  showLTCAmount = true
}: LTCPriceDisplayProps) {
  const [priceEUR, setPriceEUR] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { language } = useLanguage();
  const t = translations[language as keyof typeof translations] || translations.en;

  useEffect(() => {
    const loadPrice = async () => {
      try {
        setLoading(true);
        setError(false);
        const eurPrice = await convertLTCToEUR(priceLTC);
        setPriceEUR(eurPrice);
      } catch (err) {
        console.error('Error converting LTC price:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadPrice();
  }, [priceLTC]);

  if (loading) {
    return (
      <div className={className}>
        <p className="text-sm text-slate-400">{(t as any).loadingPrice || 'Loading...'}</p>
      </div>
    );
  }

  if (error || priceEUR === null) {
    return (
      <div className={className}>
        <p className="text-sm text-red-400">{(t as any).priceConversionError || 'Conversion error'}</p>
      </div>
    );
  }

  if (showLTCAmount) {
    return (
      <div className={className}>
        <p className="text-base font-black text-white">
          €{priceEUR.toFixed(2)} <span className="text-xs text-slate-400">≈ {priceLTC.toFixed(8)} LTC</span>
        </p>
      </div>
    );
  }

  return (
    <p className={`text-base font-black text-white ${className}`}>
      €{priceEUR.toFixed(2)}
    </p>
  );
}
