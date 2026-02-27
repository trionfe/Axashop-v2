import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
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

export default function FAQ() {
  const { language } = useLanguage();
  const t = translations[language as keyof typeof translations] || translations.en;

  const faqItems = [
    {
      question: (t as any).faqQuestion1 || "Are your products legal?",
      answer: (t as any).faqAnswer1 || "Yes, all our products are obtained through legitimate channels and comply with current digital regulations."
    },
    {
      question: (t as any).faqQuestion2 || "How is the delivery handled?",
      answer: (t as any).faqAnswer2 || "Delivery is instantaneous and automated. Once your payment is confirmed, you will receive your access or products directly."
    },
    {
      question: (t as any).faqQuestion3 || "Which payment methods are accepted?",
      answer: (t as any).faqAnswer3 || "We accept several secure payment methods, including PayPal, Litecoin (LTC), and Paysafecard."
    },
    {
      question: (t as any).faqQuestion4 || "What if I have a problem with my purchase?",
      answer: (t as any).faqAnswer4 || "Our customer support is available 24/7. In case of a technical issue, we guarantee a replacement or a credit."
    }
  ];

  return (
    <section className="py-12 relative z-30">
      <div className="container">
        <div className="max-w-4xl mx-auto">
          {/* FAQ Accordion */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
          >
            <Accordion type="single" collapsible className="space-y-4">
              {faqItems.map((item, index) => (
                <motion.div key={index} variants={itemVariants}>
                  <AccordionItem
                    value={`item-${index}`}
                    className="bg-white/[0.02] border border-white/10 rounded-2xl px-6 py-4 hover:bg-white/[0.05] hover:border-white/20 transition-all"
                  >
                    <AccordionTrigger className="hover:no-underline text-left text-white font-semibold text-lg py-0">
                      <span className="flex items-start gap-4 flex-1">
                        <span className="text-primary font-black text-xl min-w-fit">Q{index + 1}.</span>
                        <span>{item.question}</span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="text-slate-300 text-base leading-relaxed pt-6 pb-0">
                      <div className="flex gap-4">
                        <span className="text-primary font-black text-xl min-w-fit">A.</span>
                        <span>{item.answer}</span>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </motion.div>
              ))}
            </Accordion>
          </motion.div>

          {/* Additional Help */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="mt-20 p-8 rounded-2xl bg-gradient-to-r from-primary/10 to-blue-600/10 border border-white/10 text-center"
          >
            <motion.p variants={itemVariants} className="text-slate-300 mb-4">
              {language === "fr" 
                ? "Vous n'avez pas trouvé votre réponse ?"
                : "Didn't find your answer?"
              }
            </motion.p>
            <motion.a
              variants={itemVariants}
              href="/contact"
              className="inline-block px-8 py-3 bg-primary hover:bg-primary/90 text-white font-black rounded-xl transition-all hover:scale-105 active:scale-95"
            >
              {language === "fr" ? "Contactez-nous" : "Contact Us"}
            </motion.a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
