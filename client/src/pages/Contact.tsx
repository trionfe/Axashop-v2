import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, MessageSquare, Send, Globe, Clock, ShieldCheck } from "lucide-react";
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

export default function Contact() {
  const { language } = useLanguage();
  const t = translations[language as keyof typeof translations] || translations.en;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
  };

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
        <div className="absolute top-[10%] left-[5%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] right-[5%] w-[30%] h-[30%] bg-blue-500/5 blur-[100px] rounded-full" />
      </div>

      <div className="container relative z-10">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="max-w-6xl mx-auto"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center space-y-6 mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] backdrop-blur-md">
              <Mail className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-bold tracking-widest uppercase text-slate-400">{t.supportCenter}</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-black tracking-tighter">
              {(t.getInTouch || 'Get In Touch').split(' ')[0]} <span className="gradient-text">{(t.getInTouch || 'Get In Touch').split(' ').slice(1).join(' ')}</span>
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
              {t.contactDesc}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Contact Info Cards */}
            <motion.div variants={itemVariants} className="lg:col-span-5 space-y-6">
              {[
                {
                  icon: <Clock className="w-6 h-6 text-primary" />,
                  title: t.responseTime,
                  desc: t.responseTimeDesc,
                  tag: "24/7 Active"
                },
                {
                  icon: <Globe className="w-6 h-6 text-blue-400" />,
                  title: t.globalSupport,
                  desc: t.globalSupportDesc,
                  tag: "Worldwide"
                },
                {
                  icon: <ShieldCheck className="w-6 h-6 text-green-500" />,
                  title: t.secureChannel,
                  desc: t.secureChannelDesc,
                  tag: "Encrypted"
                }
              ].map((info, i) => (
                <div key={i} className="glass-card p-8 rounded-[2rem] border-white/[0.05] group hover:border-primary/30 transition-all duration-500">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                      {info.icon}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-white/5 px-3 py-1 rounded-full">{info.tag}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{info.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{info.desc}</p>
                </div>
              ))}
            </motion.div>

            {/* Contact Form */}
            <motion.div variants={itemVariants} className="lg:col-span-7">
              <div className="glass-card p-8 lg:p-12 rounded-[3rem] border-white/[0.05] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] -z-10" />
                
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">
                        {t.fullName}
                      </label>
                      <Input
                        id="name"
                        placeholder="John Doe"
                        className="h-14 bg-white/[0.02] border-white/10 rounded-2xl focus:ring-primary/20 focus:border-primary/30 transition-all"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-3">
                      <label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">
                        {t.emailAddress}
                      </label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        className="h-14 bg-white/[0.02] border-white/10 rounded-2xl focus:ring-primary/20 focus:border-primary/30 transition-all"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label htmlFor="subject" className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">
                      {t.subject}
                    </label>
                    <Input
                      id="subject"
                      placeholder="How can we help you?"
                      className="h-14 bg-white/[0.02] border-white/10 rounded-2xl focus:ring-primary/20 focus:border-primary/30 transition-all"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-3">
                    <label htmlFor="message" className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">
                      {t.message}
                    </label>
                    <Textarea
                      id="message"
                      placeholder="Describe your inquiry in detail..."
                      className="min-h-[200px] bg-white/[0.02] border-white/10 rounded-[2rem] focus:ring-primary/20 focus:border-primary/30 transition-all p-6"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-16 bg-primary hover:bg-primary/90 text-white font-black text-lg rounded-2xl shadow-[0_0_30px_-5px_rgba(59,130,246,0.5)] transition-all hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <Send className="w-5 h-5 mr-3" />
                    {t.sendMessage}
                  </Button>
                </form>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
