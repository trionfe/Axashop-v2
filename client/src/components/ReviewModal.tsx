import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: number;
  productName: string;
  buyerName: string;
  buyerEmail: string;
}

export default function ReviewModal({
  isOpen,
  onClose,
  productId,
  productName,
  buyerName,
  buyerEmail,
}: ReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const createReviewMutation = trpc.createReview.useMutation();

  const handleSubmit = async () => {
    if (!comment.trim()) {
      toast.error('Veuillez écrire un commentaire');
      return;
    }

    setIsSubmitting(true);

    try {
      await createReviewMutation.mutateAsync({
        productId,
        productName,
        userName: buyerName,
        userEmail: buyerEmail,
        rating,
        comment: comment.trim(),
      });

      setIsSuccess(true);
      toast.success('Merci pour votre avis !');

      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      toast.error('Erreur lors de l\'envoi de votre avis');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            onClick={handleSkip}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="glass-card border-white/[0.08] rounded-3xl p-8 max-w-md w-full relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleSkip}
                className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {isSuccess ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-6 py-8"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto"
                  >
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                  </motion.div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black text-white">Merci !</h2>
                    <p className="text-slate-400">Votre avis a été enregistré avec succès</p>
                  </div>
                </motion.div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-3xl font-black text-white">
                      Laissez un <span className="text-primary">avis</span>
                    </h2>
                    <p className="text-slate-400">
                      Partagez votre expérience avec <span className="text-white font-semibold">{productName}</span>
                    </p>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Votre note
                    </label>
                    <div className="flex gap-2 justify-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setHoveredRating(star)}
                          onMouseLeave={() => setHoveredRating(0)}
                          onClick={() => setRating(star)}
                          className="transition-transform hover:scale-110"
                        >
                          <Star
                            className={`w-10 h-10 transition-colors ${
                              star <= (hoveredRating || rating)
                                ? 'fill-yellow-500 text-yellow-500'
                                : 'text-slate-600'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Votre commentaire
                    </label>
                    <Textarea
                      placeholder="Partagez votre expérience avec ce produit..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="min-h-[120px] bg-white/[0.02] border-white/10 rounded-xl text-white resize-none"
                      maxLength={500}
                    />
                    <p className="text-[10px] text-slate-500 text-right">
                      {comment.length}/500
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={handleSkip}
                      variant="ghost"
                      className="flex-1 h-12 rounded-xl text-slate-400 hover:text-white"
                    >
                      Passer
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting || !comment.trim()}
                      className="flex-1 h-12 bg-primary hover:bg-primary/90 text-white font-black rounded-xl disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Envoi...
                        </>
                      ) : (
                        'Envoyer'
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
