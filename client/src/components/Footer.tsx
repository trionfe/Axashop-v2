import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { language } = useLanguage();
  const t = translations[language as keyof typeof translations] || translations.en;

  return (
    <footer className="relative border-t border-white/[0.05] bg-[#030711] pt-24 pb-12 overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[300px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="container relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
          {/* Brand */}
          <div className="space-y-6">
            <div className="text-2xl font-black tracking-tighter text-white">
              AXA<span className="text-primary">SHOP</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              {(t as any).footerDesc || "The premier destination for high-end digital assets. Engineered for privacy, speed, and uncompromising quality."}
            </p>
            <div className="flex gap-4">
              {/* Social placeholders with premium look */}
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center hover:border-primary/50 hover:bg-primary/10 transition-all cursor-pointer group">
                  <div className="w-4 h-4 bg-slate-500 group-hover:bg-primary transition-colors rounded-sm" />
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Sections */}
          {[
            {
              title: (t as any).footerMarketplace || "Marketplace",
              links: [
                { name: (t as any).footerAllProducts || "All Products", href: "/" },
                { name: (t as any).vouchers || "Vouchers", href: "/vouchers" },
                { name: (t as any).footerFeatured || "Featured", href: "/" },
                { name: (t as any).footerNewArrivals || "New Arrivals", href: "/" },
              ]
            },
            {
              title: (t as any).footerCompany || "Company",
              links: [
                { name: (t as any).footerAboutUs || "About Us", href: "/" },
                { name: (t as any).contact || "Contact", href: "/contact" },
                { name: (t as any).footerTerms || "Terms of Service", href: "/terms" },
                { name: (t as any).footerPrivacy || "Privacy Policy", href: "/" },
              ]
            },
            {
              title: (t as any).footerSupport || "Support",
              links: [
                { name: (t as any).footerHelpCenter || "Help Center", href: "/" },
                { name: (t as any).footerFAQ || "FAQ", href: "/faq" },
                { name: (t as any).footerSecurity || "Security", href: "/" },
                { name: (t as any).footerStatus || "Status", href: "/" },
              ]
            }
          ].map((section) => (
            <div key={section.title} className="space-y-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-white">{section.title}</h3>
              <ul className="space-y-4">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <a href={link.href} className="text-slate-400 hover:text-primary transition-colors text-sm font-medium">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-12 border-t border-white/[0.05] flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-slate-500 text-xs font-medium">
            © {currentYear} AXASHOP. {(t as any).footerRights || "All rights reserved. Built for the digital elite."}
          </p>
          <div className="flex gap-8">
            <a href="#" className="text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:text-slate-400 transition-colors">{(t as any).footerSystemStatus || "System Status: Operational"}</a>
            <a href="#" className="text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:text-slate-400 transition-colors">{(t as any).footerPrivacyShield || "Privacy Shield Active"}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
