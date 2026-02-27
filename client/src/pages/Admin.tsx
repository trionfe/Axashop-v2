import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { LayoutDashboard, Package, Users, ShoppingCart, Plus, Lock, ShieldAlert, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";

export default function Admin() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();

  const loginMutation = trpc.adminLogin.useMutation({
    onSuccess: () => {
      localStorage.setItem("admin_auth", "true");
      setIsAuthenticated(true);
      toast.success("Accès autorisé : Bienvenue Admin");
      setLocation("/admin");
    },
    onError: (err) => {
      toast.error("Erreur : " + err.message);
    }
  });

  // Vérifier si déjà connecté au chargement
  useEffect(() => {
    const authStatus = localStorage.getItem("admin_auth");
    if (authStatus === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await loginMutation.mutateAsync({ password });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_auth");
    setIsAuthenticated(false);
    toast.info("Déconnecté");
  };

  if (!isAuthenticated) {
    return (
      <div className="w-full bg-[#030711] min-h-screen flex items-center justify-center p-6">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full" />
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md glass-card p-10 rounded-[2.5rem] border-white/[0.05] relative z-10"
        >
          <div className="text-center space-y-6 mb-10">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mx-auto">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-black tracking-tighter">Accès <span className="text-primary">Admin</span></h1>
              <p className="text-slate-400 text-sm">Veuillez entrer le mot de passe pour continuer.</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Mot de passe sécurisé</label>
              <Input
                type="password"
                placeholder="••••••••"
                className="h-14 bg-white/[0.02] border-white/10 rounded-2xl focus:ring-primary/20 focus:border-primary/30 transition-all text-center tracking-widest"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-black rounded-2xl shadow-[0_0_20px_-5px_rgba(59,130,246,0.5)] transition-all"
              disabled={isLoading}
            >
              {isLoading ? "Authentification..." : "Déverrouiller le Dashboard"}
            </Button>
          </form>

          <div className="mt-8 flex items-center justify-center gap-2 text-slate-600">
            <ShieldAlert className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-tighter">Passerelle Admin Sécurisée</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-10 py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tighter">Centre de <span className="text-primary">Commande</span></h1>
            <p className="text-slate-400 font-medium">Gérez votre écosystème numérique premium.</p>
          </div>
          <div className="flex gap-4">
            <Button 
              onClick={handleLogout}
              variant="outline"
              className="h-12 px-6 border-white/10 text-white hover:bg-white/5 font-bold rounded-xl transition-all"
            >
              Déconnexion
            </Button>
            <Button 
              onClick={() => setLocation("/admin/products")}
              className="h-12 px-6 bg-white text-black hover:bg-primary hover:text-white font-bold rounded-xl transition-all shadow-xl"
            >
              <Plus className="w-5 h-5 mr-2" />
              Nouveau Produit
            </Button>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "Revenu Total", value: "€0.00", icon: <ShoppingCart className="w-5 h-5 text-primary" /> },
            { label: "Produits Actifs", value: "0", icon: <Package className="w-5 h-5 text-blue-400" /> },
            { label: "Total Utilisateurs", value: "0", icon: <Users className="w-5 h-5 text-indigo-400" /> },
            { label: "Commandes en attente", value: "0", icon: <LayoutDashboard className="w-5 h-5 text-slate-400" /> }
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-6 rounded-3xl border-white/[0.05] flex items-center justify-between group hover:border-primary/30 transition-all"
            >
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</p>
                <p className="text-2xl font-black text-white">{stat.value}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center group-hover:scale-110 transition-transform">
                {stat.icon}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Management Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {[
            {
              title: "Gestion des Produits",
              desc: "Gérez votre catalogue, mettez à jour les prix et gérez vos actifs numériques.",
              icon: <Package className="w-6 h-6 text-primary" />,
              action: "Gérer les Produits",
              link: "/admin/products"
            },
            {
              title: "Architecture des Catégories",
              desc: "Organisez la structure de votre boutique pour une découverte optimale.",
              icon: <LayoutDashboard className="w-6 h-6 text-blue-400" />,
              action: "Gérer les Catégories",
              link: null
            },
            {
              title: "Gestion des Avis Clients",
              desc: "Modérez et gérez les avis clients pour maintenir la qualité de votre boutique.",
              icon: <Users className="w-6 h-6 text-indigo-400" />,
              action: "Gérer les Avis",
              link: "/admin/reviews"
            },
            {
              title: "Gestion des Commandes",
              desc: "Validez les paiements manuels et livrez les produits par email.",
              icon: <ShoppingCart className="w-6 h-6 text-green-400" />,
              action: "Gérer les Commandes",
              link: "/admin/orders"
            }
          ].map((section, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -5 }}
              onClick={() => {
                if (section.link) setLocation(section.link);
              }}
              className="glass-card p-10 rounded-[2.5rem] border-white/[0.05] relative overflow-hidden group cursor-pointer"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -z-10 group-hover:bg-primary/10 transition-all" />
              
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center">
                  {section.icon}
                </div>
                <h2 className="text-2xl font-bold">{section.title}</h2>
              </div>
              
              <p className="text-slate-400 mb-8 leading-relaxed">
                {section.desc}
              </p>
              
              <div className="flex items-center text-sm font-black uppercase tracking-widest text-primary group-hover:text-blue-400 transition-colors">
                {section.action}
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
