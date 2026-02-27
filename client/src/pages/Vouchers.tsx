import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

// Données extraites du fichier voocher.txt
const reviewsData = [
  {
    date: "09/01/2026",
    client: "Unable",
    product: "Tech Snap+ (4.50€)",
    comment: "Transaction rapide pour le Snap+. À 4.50€ c'est carré, tout fonctionne. Merci AXA !",
    rating: 5
  },
  {
    date: "11/01/2026",
    client: "RENDEZ MOI MON COMPTE",
    product: "Disney+ (2.40€)",
    comment: "Compte Disney+ bien reçu. Pour 2.40€ ça vaut vraiment le coup, je recommande.",
    rating: 5
  },
  {
    date: "22/01/2026",
    client: "NonoSnk",
    product: "Nord VPN Lifetime (3.60€)",
    comment: "Nord VPN Lifetime validé. Vendeur fiable et rapide.",
    rating: 5
  },
  {
    date: "26/01/2026",
    client: "NonoSnk",
    product: "Pack Tech Nike, Crunchy, Steam",
    comment: "Grosse commande (Nike, Crunchyroll, Steam) et aucun souci. Le pack à 13.50€ est incroyable.",
    rating: 5
  },
  {
    date: "13/02/2026",
    client: "Unable",
    product: "Crunchyroll (2.00€)",
    comment: "Encore un achat chez AXA. Compte Crunchyroll reçu instantanément. Toujours au top.",
    rating: 5
  }
];

// Liste des images de preuve
const proofImages = [
  "/proof/2.png", "/proof/3.png", "/proof/4.2.png", "/proof/4.png", "/proof/5.png",
  "/proof/Capture_decran_2025-11-30_211935.png", "/proof/image.png", "/proof/IMG_3791.png",
  "/proof/IMG_3792.png", "/proof/IMG_3897.png", "/proof/IMG_3916.png", "/proof/IMG_3951.png",
  "/proof/IMG_3976.png", "/proof/IMG_4212.png"
];

// Composant Lightbox
const Lightbox = ({ 
  isOpen, 
  currentIndex, 
  images, 
  onClose, 
  onNext, 
  onPrev 
}: {
  isOpen: boolean;
  currentIndex: number;
  images: string[];
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "ArrowRight") onNext();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onNext, onPrev, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl"
          >
            {/* Image */}
            <div className="relative bg-black rounded-2xl overflow-hidden">
              <img
                src={images[currentIndex]}
                alt={`Proof ${currentIndex}`}
                className="w-full h-auto max-h-[80vh] object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://via.placeholder.com/800x600/1e293b/ffffff?text=Image+Not+Found";
                }}
              />
            </div>

            {/* Navigation Buttons */}
            <button
              onClick={onPrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all backdrop-blur-md border border-white/20 text-white"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={onNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all backdrop-blur-md border border-white/20 text-white"
              aria-label="Next image"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all backdrop-blur-md border border-white/20 text-white"
              aria-label="Close lightbox"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-bold">
              {currentIndex + 1} / {images.length}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default function Vouchers() {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleImageClick = (index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % proofImages.length);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + proofImages.length) % proofImages.length);
  };

  const handleCloseLightbox = () => {
    setLightboxOpen(false);
  };

  // Double the images for seamless loop
  const doubledImages = [...proofImages, ...proofImages, ...proofImages];

  return (
    <div className="min-h-screen bg-[#030711] text-slate-200 selection:bg-blue-500/30 font-sans overflow-x-hidden relative">
      {/* Background with Glass Effect */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Upper part: Original Dark Background */}
        <div className="absolute top-0 w-full h-[450px] bg-[#030711]" />
        
        {/* Lower part: Glassmorphism / iOS Blur Effect */}
        <div className="absolute top-[450px] bottom-0 w-full bg-white/[0.01] backdrop-blur-[20px]" />
      </div>

      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none z-[1]">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-8 py-16">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-6xl font-black text-white tracking-tighter mb-4">
              What our <span className="text-blue-500">users say</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Découvrez les retours de nos clients et les preuves de nos transactions réussies.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Left Side: Vertical Scrolling Images */}
            <div className="lg:col-span-5 relative h-[600px] rounded-3xl overflow-hidden border border-white/10 bg-black/20 backdrop-blur-sm group">
              <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#0f172a] to-transparent z-20 pointer-events-none" />
              <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0f172a] to-transparent z-20 pointer-events-none" />
              
              <motion.div 
                className="flex flex-col gap-4 p-4"
                animate={{ 
                  y: [0, -100 * proofImages.length] 
                }}
                transition={{ 
                  duration: 30, 
                  repeat: Infinity, 
                  ease: "linear" 
                }}
              >
                {doubledImages.map((img, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => handleImageClick(i % proofImages.length)}
                    className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-white/5 cursor-pointer aspect-[4/3] flex-shrink-0"
                  >
                    <img 
                      src={img} 
                      alt={`Proof ${i}`} 
                      className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-all duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x300/1e293b/ffffff?text=Proof";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Right Side: Reviews List */}
            <div className="lg:col-span-7 space-y-6 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
              {reviewsData.map((review, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  viewport={{ once: true }}
                  className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/[0.08] hover:border-blue-500/30 transition-all duration-300 group"
                >
                  <div className="flex items-start gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <span className="font-black text-blue-400 text-xl">{review.client[0]}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-black text-white text-lg">{review.client}</h4>
                          <p className="text-blue-500 text-xs font-bold uppercase tracking-widest">{review.product}</p>
                        </div>
                        <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest bg-white/5 px-3 py-1 rounded-full">{review.date}</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed text-lg italic">"{review.comment}"</p>
                      <div className="mt-4 flex gap-1">
                        {[...Array(review.rating)].map((_, i) => (
                          <motion.span 
                            key={i} 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.5 + (i * 0.1) }}
                            className="text-yellow-500 text-xl"
                          >
                            ★
                          </motion.span>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      <Lightbox
        isOpen={lightboxOpen}
        currentIndex={currentImageIndex}
        images={proofImages}
        onClose={handleCloseLightbox}
        onNext={handleNextImage}
        onPrev={handlePrevImage}
      />

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.4);
        }
      `}} />
    </div>
  );
}
