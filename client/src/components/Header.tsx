import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";

import { Menu, X, ChevronRight, ShoppingCart } from "lucide-react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";
import { useCart } from "@/contexts/CartContext";

function CartWidget() {
  const { getTotalItems } = useCart();
  const [, navigate] = useLocation();
  const totalItems = getTotalItems();

  return (
    <Button
      onClick={() => navigate('/cart')}
      className="relative h-10 px-4 bg-white/[0.03] border border-white/10 text-white hover:bg-white/5 rounded-xl transition-all"
    >
      <ShoppingCart className="w-5 h-5" />
      {totalItems > 0 && (
        <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center">
          {totalItems}
        </span>
      )}
    </Button>
  );
}

export default function Header() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [, navigate] = useLocation();
  const { language, setLanguage } = useLanguage();

  const t = translations[language as keyof typeof translations] || translations.en;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header 
      className={`fixed top-0 z-[100] w-full transition-all duration-500 py-4 bg-background border-b border-white/10 shadow-2xl`}
    >
      <div className="container flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-12">
          <a href="/" className="group relative">
            <div className="text-2xl font-black tracking-tighter text-white flex items-center">
              AXA<span className="text-primary group-hover:text-blue-400 transition-colors">SHOP</span>
              <div className="ml-1 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            </div>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {[
              { name: t.home, href: "/" },
              { name: t.vouchers, href: "/vouchers" },
              { name: "FAQ", href: "/faq" },
              { name: t.terms, href: "/terms" },
              { name: t.contact, href: "/contact" },
            ].map((link) => (
              <a 
                key={link.name}
                href={link.href} 
                className="text-sm font-semibold text-slate-400 hover:text-white transition-colors relative group"
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
              </a>
            ))}
            {(user?.role === "admin" || localStorage.getItem("admin_auth") === "true") && (
              <a href="/admin" className="text-sm font-semibold text-primary hover:text-blue-400 transition-colors">
                {(t as any).dashboard}
              </a>
            )}
          </nav>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-6">
          {/* Cart Widget */}
          <CartWidget />

          {/* Language Selector */}
          <div className="hidden md:flex items-center gap-1 bg-white/[0.03] border border-white/[0.08] rounded-full p-1">
            {["en", "fr"].map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang as "en" | "fr")}
                className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest transition-all ${
                  language === lang
                    ? "bg-primary text-white shadow-lg"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                  <span className="text-xs font-bold text-white">{user.name}</span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-tighter">Member</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-slate-400 hover:text-white hover:bg-white/5 rounded-xl"
                >
                  {t.logout}
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="bg-[#5865F2] text-white hover:bg-[#4752C4] font-bold rounded-xl px-3 h-8 text-[11px] transition-all shadow-xl border-none"
                  asChild
                >
                  <a href="https://discord.gg/eesPrGvp" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 11.747 11.747 0 0 0-.617-1.25.077.077 0 0 0-.079-.037 19.736 19.736 0 0 0-4.885 1.515.069.069 0 0 0-.032.027C.533 9.048-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.419-2.157 2.419z"/>
                    </svg>
                    Discord
                  </a>
                </Button>
                <Button
                  size="sm"
                  className="bg-[#0088cc] text-white hover:bg-[#0077b3] font-bold rounded-xl px-3 h-8 text-[11px] transition-all shadow-xl border-none"
                  asChild
                >
                  <a href="https://t.me/+Kmd9j1fJ-dQ3Nzc0" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.52-1.4.51-.46-.01-1.35-.26-2.01-.48-.81-.27-1.45-.42-1.39-.89.03-.25.38-.51 1.07-.78 4.2-1.82 7-3.03 8.4-3.61 4-.1.17.83.17.83z"/>
                    </svg>
                    Telegram
                  </a>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 top-[73px] bg-background z-[90] p-8 animate-in fade-in slide-in-from-top-4 duration-300">
          <nav className="flex flex-col gap-6">
            {[
              { name: t.home, href: "/" },
              { name: t.vouchers, href: "/vouchers" },
              { name: "FAQ", href: "/faq" },
              { name: t.terms, href: "/terms" },
              { name: t.contact, href: "/contact" },
            ].map((link) => (
              <a 
                key={link.name}
                href={link.href} 
                className="text-2xl font-bold text-slate-200 hover:text-primary transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </a>
            ))}
            {(user?.role === "admin" || localStorage.getItem("admin_auth") === "true") && (
              <a href="/admin" className="text-2xl font-bold text-primary" onClick={() => setIsOpen(false)}>
                {t.dashboard}
              </a>
            )}
            
            {/* Language Selector Mobile */}
            <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.08] rounded-full p-1 mt-6">
              {["en", "fr"].map((lang) => (
                <button
                  key={lang}
                  onClick={() => {
                    setLanguage(lang as "en" | "fr");
                    setIsOpen(false);
                  }}
                  className={`flex-1 px-3 py-2 rounded-full text-sm font-black tracking-widest transition-all ${
                    language === lang
                      ? "bg-primary text-white shadow-lg"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>
            
            <div className="pt-8 border-t border-white/10 mt-auto">
              {user ? (
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="w-full h-14 rounded-2xl border-white/10 text-white"
                >
                  {t.logout}
                </Button>
              ) : (
                <div className="flex items-center gap-3">
                  <Button
                    className="flex-1 h-12 rounded-2xl bg-[#5865F2] text-white font-bold text-sm hover:bg-[#4752C4]"
                    asChild
                  >
                    <a href="https://discord.gg/eesPrGvp" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 11.747 11.747 0 0 0-.617-1.25.077.077 0 0 0-.079-.037 19.736 19.736 0 0 0-4.885 1.515.069.069 0 0 0-.032.027C.533 9.048-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.419-2.157 2.419z"/>
                      </svg>
                      Discord
                    </a>
                  </Button>
                  <Button
                    className="flex-1 h-12 rounded-2xl bg-[#0088cc] text-white font-bold text-sm hover:bg-[#0077b3]"
                    asChild
                  >
                    <a href="https://t.me/+Kmd9j1fJ-dQ3Nzc0" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.52-1.4.51-.46-.01-1.35-.26-2.01-.48-.81-.27-1.45-.42-1.39-.89.03-.25.38-.51 1.07-.78 4.2-1.82 7-3.03 8.4-3.61 4-.1.17.83.17.83z"/>
                      </svg>
                      Telegram
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
