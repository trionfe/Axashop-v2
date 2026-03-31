// client/src/pages/AdminVisitors.tsx
// ✅ SÉCURISÉ — Toutes les requêtes passent par le serveur. Zéro clé dans le frontend.

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { RefreshCw, Globe, Monitor, Smartphone, Tablet, Wifi, Shield, Clock, Search, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ✅ Plus de SUPABASE_URL / SUPABASE_KEY ici

const FLAG = (code: string) => code ? `https://flagcdn.com/24x18/${code.toLowerCase()}.png` : null;

const BROWSER_COLORS: Record<string, string> = {
  Chrome: "text-yellow-400", Firefox: "text-orange-400", Safari: "text-blue-400",
  Edge: "text-cyan-400", Opera: "text-red-400", Inconnu: "text-slate-400"
};

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}j`;
}

function DeviceIcon({ device }: { device: string }) {
  if (device === "Mobile") return <Smartphone className="w-4 h-4 text-primary" />;
  if (device === "Tablette") return <Tablet className="w-4 h-4 text-purple-400" />;
  return <Monitor className="w-4 h-4 text-slate-400" />;
}

export default function AdminVisitors() {
  const [visitors, setVisitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, today: 0, unique: 0, mobile: 0 });

  async function load() {
    setLoading(true);
    try {
      // ✅ Appel vers notre API serveur (authentifié côté serveur)
      const res = await fetch("/api/supabase/visitors");
      if (!res.ok) { setLoading(false); return; }
      const data = await res.json();
      setVisitors(data || []);

      const today = new Date().toDateString();
      const todayVisits = data.filter((v: any) => new Date(v.visited_at).toDateString() === today);
      const uniqueIPs = new Set(data.map((v: any) => v.ip)).size;
      const mobileCount = data.filter((v: any) => v.device === "Mobile").length;
      setStats({ total: data.length, today: todayVisits.length, unique: uniqueIPs, mobile: mobileCount });
    } catch {}
    setLoading(false);
  }

  async function deleteVisitor(id: number) {
    // ✅ DELETE via serveur (authentifié)
    await fetch(`/api/supabase/visitors/${id}`, { method: "DELETE" });
    setVisitors(v => v.filter((x: any) => x.id !== id));
  }

  async function clearAll() {
    if (!confirm("Supprimer tous les visiteurs ?")) return;
    // ✅ DELETE via serveur (authentifié)
    await fetch("/api/supabase/visitors", { method: "DELETE" });
    setVisitors([]);
    setStats({ total: 0, today: 0, unique: 0, mobile: 0 });
  }

  useEffect(() => { load(); }, []);

  const filtered = visitors.filter(v => {
    const q = search.toLowerCase();
    return !q || v.ip?.includes(q) || v.city?.toLowerCase().includes(q) ||
      v.country?.toLowerCase().includes(q) || v.browser?.toLowerCase().includes(q) ||
      v.isp?.toLowerCase().includes(q) || v.page?.toLowerCase().includes(q);
  });

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-5 max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-white">Visiteurs</h1>
            <p className="text-slate-400 text-sm mt-0.5">Données en temps réel</p>
          </div>
          <div className="flex gap-2">
            <button onClick={clearAll}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold hover:bg-red-500/20 transition-all">
              <Trash2 className="w-3.5 h-3.5" /> Vider
            </button>
            <button onClick={load}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm font-bold hover:bg-white/10 transition-all ${loading ? "opacity-60" : ""}`}>
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Actualiser
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total", value: stats.total, icon: Globe },
            { label: "Aujourd'hui", value: stats.today, icon: Clock },
            { label: "IPs uniques", value: stats.unique, icon: Wifi },
            { label: "Mobile", value: stats.mobile, icon: Smartphone },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-white/3 border border-white/8 rounded-xl p-3 flex items-center gap-3">
              <Icon className="w-5 h-5 text-primary shrink-0" />
              <div>
                <p className="text-xs text-slate-500">{label}</p>
                <p className="text-lg font-black text-white">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par IP, ville, pays, navigateur..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-primary/50"
          />
        </div>

        {/* List */}
        <div className="space-y-2">
          {loading ? (
            <div className="text-center py-12 text-slate-500">Chargement...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-500">Aucun visiteur trouvé</div>
          ) : (
            <AnimatePresence>
              {filtered.map((v: any) => (
                <motion.div key={v.id}
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="bg-white/3 border border-white/8 rounded-xl overflow-hidden">
                  <div className="p-3 flex items-center gap-3 cursor-pointer"
                    onClick={() => setExpanded(expanded === String(v.id) ? null : String(v.id))}>
                    <DeviceIcon device={v.device} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {v.country_code && (
                          <img src={FLAG(v.country_code)!} alt={v.country_code}
                            className="w-4 h-3 rounded-sm object-cover shrink-0" />
                        )}
                        <span className="text-white text-sm font-bold truncate">{v.ip}</span>
                        <span className="text-slate-500 text-xs">{v.city}, {v.country}</span>
                        <span className={`text-xs font-semibold ${BROWSER_COLORS[v.browser] || "text-slate-400"}`}>{v.browser} {v.browser_version}</span>
                        <span className="text-slate-600 text-xs">{v.os}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-slate-500 text-xs truncate">{v.page}</span>
                        <span className="text-slate-600 text-xs shrink-0">{timeAgo(v.visited_at)}</span>
                        {v.is_vpn && <Shield className="w-3 h-3 text-orange-400 shrink-0" title="VPN détecté" />}
                      </div>
                    </div>
                    <button onClick={e => { e.stopPropagation(); deleteVisitor(v.id); }}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-600 hover:text-red-400 transition-all shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    {expanded === String(v.id) ? <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />}
                  </div>

                  <AnimatePresence>
                    {expanded === String(v.id) && (
                      <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                        className="overflow-hidden border-t border-white/5">
                        <div className="p-3 grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                          {[
                            ["ISP", v.isp], ["Réseau", v.connection_type], ["Type", v.network_type],
                            ["Vitesse", v.network_speed], ["RAM", v.ram], ["CPU", v.cpu],
                            ["Langue", v.language], ["Écran", v.screen], ["Couleurs", v.color_depth],
                            ["Timezone", v.timezone], ["Session", v.session_id],
                            ["Referrer", v.referrer_full || v.referrer],
                          ].map(([label, value]) => (
                            <div key={label}>
                              <span className="text-slate-600">{label}: </span>
                              <span className="text-slate-300">{value || "—"}</span>
                            </div>
                          ))}
                          <div><span className="text-slate-600">AdBlock: </span>
                            <span className={v.has_adblock ? "text-orange-400" : "text-green-400"}>{v.has_adblock ? "Oui" : "Non"}</span>
                          </div>
                          <div><span className="text-slate-600">Privé: </span>
                            <span className={v.is_private ? "text-orange-400" : "text-slate-300"}>{v.is_private ? "Oui" : "Non"}</span>
                          </div>
                          <div><span className="text-slate-600">Tab cachée: </span>
                            <span className="text-slate-300">{v.tab_hidden ? "Oui" : "Non"}</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
