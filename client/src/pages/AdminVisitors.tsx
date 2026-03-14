import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { RefreshCw, Globe, Monitor, Smartphone, Tablet, Wifi, Shield, Clock, Search, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SUPABASE_URL = "https://eqzcmxtrkgmcjhvbnefq.supabase.co";
const SUPABASE_KEY = "sb_publishable_efQGrrNRPLO7uLmKqsA5Jw_uyGx5Cc7";

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
      const res = await fetch(`${SUPABASE_URL}/rest/v1/Visitors?select=*&order=visited_at.desc&limit=500`, {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
      });
      if (!res.ok) { setLoading(false); return; }
      const data = await res.json();
      setVisitors(data || []);

      // Stats
      const today = new Date().toDateString();
      const todayVisits = data.filter((v: any) => new Date(v.visited_at).toDateString() === today);
      const uniqueIPs = new Set(data.map((v: any) => v.ip)).size;
      const mobileCount = data.filter((v: any) => v.device === "Mobile").length;
      setStats({ total: data.length, today: todayVisits.length, unique: uniqueIPs, mobile: mobileCount });
    } catch {}
    setLoading(false);
  }

  async function deleteVisitor(id: number) {
    await fetch(`${SUPABASE_URL}/rest/v1/Visitors?id=eq.${id}`, {
      method: "DELETE",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
    setVisitors(v => v.filter((x: any) => x.id !== id));
  }

  async function clearAll() {
    if (!confirm("Supprimer tous les visiteurs ?")) return;
    await fetch(`${SUPABASE_URL}/rest/v1/Visitors?id=gt.0`, {
      method: "DELETE",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
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

        {/* Header */}
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
            { label: "Total visites", value: stats.total, icon: Globe, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
            { label: "Aujourd'hui", value: stats.today, icon: Clock, color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
            { label: "IPs uniques", value: stats.unique, icon: Shield, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
            { label: "Mobile", value: stats.mobile, icon: Smartphone, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
          ].map(s => (
            <div key={s.label} className={`rounded-2xl border p-4 ${s.bg}`}>
              <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
              <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-slate-400 text-xs mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher IP, ville, pays, navigateur..."
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-primary/50" />
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Globe className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>Aucun visiteur enregistré</p>
            <p className="text-xs mt-1">Les visites s'enregistrent automatiquement</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((v: any) => (
              <motion.div key={v.id} layout
                className="bg-white/[0.03] border border-white/8 rounded-2xl overflow-hidden hover:border-white/15 transition-all">

                {/* Row principale */}
                <div className="flex items-center gap-3 p-3.5 cursor-pointer"
                  onClick={() => setExpanded(expanded === v.id ? null : v.id)}>

                  {/* Flag + IP */}
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {FLAG(v.country_code) && (
                      <img src={FLAG(v.country_code)!} alt={v.country_code}
                        className="w-6 h-4 rounded-sm object-cover flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="font-mono text-sm text-white font-bold truncate flex items-center gap-1.5">
                        {v.ip}
                        {v.is_vpn && (
                          <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded-md font-bold">VPN</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 truncate">{v.city}, {v.country}</div>
                    </div>
                  </div>

                  {/* Device + Browser */}
                  <div className="hidden md:flex items-center gap-2">
                    <DeviceIcon device={v.device} />
                    <span className={`text-xs font-bold ${BROWSER_COLORS[v.browser] || "text-slate-400"}`}>
                      {v.browser} {v.browser_version}
                    </span>
                  </div>

                  {/* Page */}
                  <div className="hidden lg:block">
                    <span className="text-xs bg-white/5 border border-white/10 px-2 py-1 rounded-lg text-slate-300 font-mono">
                      {v.page || "/"}
                    </span>
                  </div>

                  {/* Time */}
                  <div className="text-xs text-slate-500 flex-shrink-0">{timeAgo(v.visited_at)}</div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={e => { e.stopPropagation(); deleteVisitor(v.id); }}
                      className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    {expanded === v.id
                      ? <ChevronUp className="w-4 h-4 text-slate-500" />
                      : <ChevronDown className="w-4 h-4 text-slate-500" />}
                  </div>
                </div>

                {/* Expanded detail */}
                <AnimatePresence>
                  {expanded === v.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                      className="overflow-hidden border-t border-white/8">
                      <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {[
                          { label: "IP", value: v.ip },
                          { label: "Pays", value: `${v.country} (${v.country_code})` },
                          { label: "Ville", value: v.city },
                          { label: "Région", value: v.region },
                          { label: "FAI / Réseau", value: v.isp },
                          { label: "Type connexion", value: v.connection_type },
                          { label: "VPN", value: v.is_vpn ? "🔴 Oui" : "🟢 Non" },
                          { label: "Navigateur", value: `${v.browser} ${v.browser_version}` },
                          { label: "OS", value: v.os },
                          { label: "Appareil", value: v.device },
                          { label: "Langue", value: v.language },
                          { label: "Écran", value: v.screen },
                          { label: "Fuseau", value: v.timezone },
                          { label: "Page visitée", value: v.page },
                          { label: "Référent", value: v.referrer },
                          { label: "Référent complet", value: v.referrer_full || "—" },
                          { label: "RAM", value: v.ram },
                          { label: "CPU", value: v.cpu },
                          { label: "Réseau", value: v.network_type },
                          { label: "Vitesse réseau", value: v.network_speed },
                          { label: "Mode privé", value: v.is_private ? "🔴 Oui" : "🟢 Non" },
                          { label: "Bloqueur pub", value: v.has_adblock ? "🔴 Oui" : "🟢 Non" },
                          { label: "Onglet caché", value: v.tab_hidden ? "Oui (arrière-plan)" : "Non (actif)" },
                          { label: "Profondeur couleur", value: v.color_depth },
                          { label: "Session ID", value: v.session_id },
                          { label: "Date/Heure", value: new Date(v.visited_at).toLocaleString("fr-FR") },
                        ].map(item => (
                          <div key={item.label} className="bg-white/[0.03] rounded-xl p-3 border border-white/5">
                            <div className="text-xs text-slate-500 mb-1">{item.label}</div>
                            <div className="text-sm text-white font-medium break-all">{item.value || "—"}</div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}

        <p className="text-center text-xs text-slate-600 pb-4">
          {filtered.length} visiteur{filtered.length > 1 ? "s" : ""} affiché{filtered.length > 1 ? "s" : ""}
        </p>
      </div>
    </DashboardLayout>
  );
}
