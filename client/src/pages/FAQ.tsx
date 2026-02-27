import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";
import FAQ from "@/components/FAQ";
import { motion } from "framer-motion";

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

export default function FAQPage() {
  const { language } = useLanguage();
  const t = translations[language as keyof typeof translations] || translations.en;

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
      <section className="relative min-h-[50vh] flex items-center pt-20 overflow-hidden z-10">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[150px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[130px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="container relative z-10">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="max-w-3xl mx-auto text-center space-y-8"
          >
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.08] backdrop-blur-md shadow-2xl">
              <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
              <span className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-400">
                {language === "fr" ? "ASSISTANCE CLIENT" : "CUSTOMER SUPPORT"}
              </span>
            </motion.div>

            <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.85] text-white">
              {(t as any).faqTitle || "Frequently Asked Questions"}
            </motion.h1>

            <motion.p variants={itemVariants} className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium">
              {(t as any).faqDesc || "Find answers to common questions about our services and products."}
            </motion.p>
          </motion.div>
        </div>

      </section>

      {/* FAQ Section */}
      <FAQ />
    </div>
  );
}
