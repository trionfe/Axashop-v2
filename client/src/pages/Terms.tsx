import { motion } from "framer-motion";
import { FileText, Shield, Scale, AlertCircle, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5, ease: "circOut" as const }
  }
};

export default function Terms() {
  const { language } = useLanguage();
  const t = translations[language as keyof typeof translations] || translations.en;

  const sections = [
    {
      icon: <Shield className="w-6 h-6 text-primary" />,
      title: t.refundPolicyTitle || "Refund Policy",
      content: t.refundPolicyContent,
      items: []
    },
    {
      icon: <CheckCircle2 className="w-6 h-6 text-green-500" />,
      title: t.guaranteesTitle || "Our Guarantees",
      content: t.guaranteesContent,
      items: [
        t.guarantee1,
        t.guarantee2,
        t.guarantee3,
        t.guarantee4,
        t.guarantee5
      ]
    },
    {
      icon: <AlertCircle className="w-6 h-6 text-yellow-500" />,
      title: t.usageRulesTitle || "Usage Rules",
      content: t.usageRulesContent,
      items: [
        t.rule1,
        t.rule2,
        t.rule3,
        t.rule4,
        t.rule5
      ]
    },
    {
      icon: <FileText className="w-6 h-6 text-blue-400" />,
      title: t.accountSecurityTitle || "Account Security",
      content: t.accountSecurityContent,
      items: []
    }
  ];

  return (
    <div className="w-full bg-[#030711] min-h-screen pt-32 pb-24 relative overflow-x-hidden">
      {/* Background with Glass Effect */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Upper part: Original Dark Background */}
        <div className="absolute top-0 w-full h-[450px] bg-[#030711]" />
        
        {/* Lower part: Glassmorphism / iOS Blur Effect */}
        <div className="absolute top-[450px] bottom-0 w-full bg-white/[0.01] backdrop-blur-[20px]" />
      </div>

      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-[1]">
        <div className="absolute top-[20%] left-[10%] w-[30%] h-[30%] bg-primary/5 blur-[120px] rounded-full" />
      </div>

      <div className="container relative z-10">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center space-y-6 mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] backdrop-blur-md">
              <Scale className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-bold tracking-widest uppercase text-slate-400">{t.termsBadge || "Legal Framework"}</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-black tracking-tighter">
              {(t.termsTitle || 'Terms of Service').split(' ').slice(0, -1).join(' ')} <span className="gradient-text">{(t.termsTitle || 'Terms of Service').split(' ').slice(-1)}</span>
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
              {t.termsDesc}
            </p>
          </motion.div>

          {/* Content Sections */}
          <div className="space-y-12">
            {sections.map((section, i) => (
              <motion.section 
                key={i} 
                variants={itemVariants}
                className="glass-card p-8 lg:p-12 rounded-[2.5rem] border-white/[0.05] relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -z-10 group-hover:bg-primary/10 transition-all duration-700" />
                
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center">
                    {section.icon}
                  </div>
                  <h2 className="text-2xl lg:text-3xl font-bold">{section.title}</h2>
                </div>

                <div className="space-y-6">
                  <p className="text-slate-400 leading-relaxed text-lg">
                    {section.content}
                  </p>

                  {section.items && section.items.length > 0 && (
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                      {section.items.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                          <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                          <span className="text-sm text-slate-300 font-medium">{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </motion.section>
            ))}
          </div>

          {/* Footer Note */}
          <motion.div variants={itemVariants} className="mt-20 text-center">
            <p className="text-slate-500 text-sm">
              {t.termsLastUpdated}. {t.legalInquiries}
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
