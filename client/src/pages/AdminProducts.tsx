import { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit2, Trash2, Save, X, Settings, Upload, RefreshCw, Layers, Package, ChevronDown, ChevronUp } from "lucide-react";
import { getSettings, saveSettings } from "@/lib/products";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

// ✅ SÉCURISÉ — Aucune clé DB. Tout passe par /api/neon/* (serveur Neon).

// ── Produits simples ──────────────────────────────────────────────────────────
async function loadProducts(): Promise<any[]> {
  try {
    const res = await fetch("/api/neon/products");
    if (!res.ok) return [];
    const rows = await res.json();
    return rows[0]?.Data || [];
  } catch { return []; }
}

async function compressImage(base64: string, maxWidth = 900): Promise<string> {
  if (!base64 || !base64.startsWith("data:image")) return base64;
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ratio = Math.min(1, maxWidth / img.width);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/webp", 0.82));
    };
    img.onerror = () => resolve(base64);
    img.src = base64;
  });
}

async function compressAllImages(products: any[]): Promise<any[]> {
  return Promise.all(products.map(async p => ({
    ...p,
    image: p.image ? await compressImage(p.image) : p.image
  })));
}

async function saveProducts(products: any[]): Promise<boolean> {
  try {
    const compressed = await compressAllImages(products);
    const res = await fetch("/api/neon/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ Data: compressed }),
    });
    return res.ok;
  } catch { return false; }
}

// ── Groupes ───────────────────────────────────────────────────────────────────
async function loadGroups(): Promise<any[]> {
  try {
    const res = await fetch("/api/neon/groups");
    if (!res.ok) return [];
    return await res.json() || [];
  } catch { return []; }
}

async function saveGroup(group: any): Promise<boolean> {
  try {
    const payload = { label: group.label, category: group.category, image: group.image, options: group.options };
    if (group.id) {
      const res = await fetch(`/api/neon/groups/${group.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return res.ok;
    } else {
      const res = await fetch("/api/neon/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return res.ok;
    }
  } catch { return false; }
}

async function deleteGroup(id: number): Promise<boolean> {
  try {
    const res = await fetch(`/api/neon/groups/${id}`, { method: "DELETE" });
    return res.ok;
  } catch { return false; }
}

// ── Maintenance ───────────────────────────────────────────────────────────────
async function loadMaintenance(): Promise<boolean> {
  try {
    const res = await fetch("/api/neon/settings/maintenance");
    if (!res.ok) return false;
    const data = await res.json();
    return data?.maintenance === true;
  } catch { return false; }
}

async function setMaintenanceApi(enabled: boolean): Promise<void> {
  await fetch("/api/neon/settings/maintenance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ enabled }),
  });
}

// ── UI helpers ────────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">{label}</p>
      {children}
    </div>
  );
}

const EMPTY_PRODUCT = { id: "", columnId: "Social", nameKey: "", descKey: "", pricePayPal: "0", priceLTC: "0", pricePSC: "0", image: "", stock: 29 };
const EMPTY_GROUP = { label: "", category: "Social", image: "", options: [] };
const EMPTY_OPTION = { id: "", name: "", pricePayPal: "0", priceLTC: "0", pricePSC: "0", image: "", stock: 29 };

export default function AdminProducts() {
  const [tab, setTab] = useState<"products" | "groups">("products");
  const [products, setProducts] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);
  const [settings, setSettingsLocal] = useState(getSettings());

  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [form, setForm] = useState<any>(null);
  const imageRef = useRef<HTMLInputElement>(null);

  const [groupModal, setGroupModal] = useState<"add" | "edit" | null>(null);
  const [groupForm, setGroupForm] = useState<any>(null);
  const [editingOptionIdx, setEditingOptionIdx] = useState<number | null>(null);
  const [optionForm, setOptionForm] = useState<any>(null);
  const groupImageRef = useRef<HTMLInputElement>(null);
  const optionImageRef = useRef<HTMLInputElement>(null);
  const [expandedGroup, setExpandedGroup] = useState<number | null>(null);

  useEffect(() => {
    // ✅ Chargement maintenance via serveur
    loadMaintenance().then(setMaintenanceMode).catch(() => {});
    Promise.all([loadProducts(), loadGroups()]).then(([p, g]) => {
      setProducts(p);
      setGroups(g);
      setLoading(false);
    });
  }, []);

  // ── Produits simples ──────────────────────────────────────────────────────
  const persist = async (newProducts: any[]) => {
    setSaving(true);
    const ok = await saveProducts(newProducts);
    setSaving(false);
    if (ok) toast.success("Sauvegardé ✅");
    else toast.error("Erreur de sauvegarde ❌");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (v: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setter(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    const newProducts = products.map(p => p.id === form.id ? {
      ...form, pricePayPal: parseFloat(form.pricePayPal), priceLTC: parseFloat(form.priceLTC), pricePSC: parseFloat(form.pricePSC), stock: parseInt(form.stock) || 0,
    } : p);
    setProducts(newProducts); setModal(null); await persist(newProducts);
  };

  const handleAdd = async () => {
    if (!form.nameKey || !form.pricePayPal) { toast.error("Remplir au moins le nom et le prix PayPal"); return; }
    const newProd = { ...form, id: `prod-${Date.now()}`, pricePayPal: parseFloat(form.pricePayPal), priceLTC: parseFloat(form.priceLTC), pricePSC: parseFloat(form.pricePSC), stock: parseInt(form.stock) || 0 };
    const newProducts = [newProd, ...products];
    setProducts(newProducts); setModal(null); await persist(newProducts);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Supprimer ce produit ?")) return;
    const newProducts = products.filter(p => p.id !== id);
    setProducts(newProducts); await persist(newProducts);
  };

  // ── Groupes ───────────────────────────────────────────────────────────────
  const openAddGroup = () => {
    setGroupForm({ ...EMPTY_GROUP, options: [] });
    setGroupModal("add");
    setEditingOptionIdx(null);
    setOptionForm(null);
  };

  const openEditGroup = (g: any) => {
    setGroupForm({ ...g, options: g.options || [] });
    setGroupModal("edit");
    setEditingOptionIdx(null);
    setOptionForm(null);
  };

  const handleGroupSave = async () => {
    if (!groupForm.label) { toast.error("Remplir le nom du groupe"); return; }
    setSaving(true);
    const ok = await saveGroup(groupForm);
    setSaving(false);
    if (ok) {
      toast.success("Groupe sauvegardé ✅");
      const g = await loadGroups();
      setGroups(g);
      setGroupModal(null);
    } else toast.error("Erreur ❌");
  };

  const handleGroupDelete = async (id: number) => {
    if (!window.confirm("Supprimer ce groupe ?")) return;
    await deleteGroup(id);
    setGroups(groups.filter(g => g.id !== id));
  };

  const addOption = () => {
    const opt = { ...EMPTY_OPTION, id: `opt-${Date.now()}` };
    setGroupForm((g: any) => ({ ...g, options: [...(g.options || []), opt] }));
    setEditingOptionIdx((groupForm.options || []).length);
    setOptionForm(opt);
  };

  const saveOption = () => {
    if (!optionForm.name) { toast.error("Remplir le nom de l'option"); return; }
    const opts = [...(groupForm.options || [])];
    opts[editingOptionIdx!] = {
      ...optionForm,
      pricePayPal: parseFloat(optionForm.pricePayPal),
      priceLTC: parseFloat(optionForm.priceLTC),
      pricePSC: parseFloat(optionForm.pricePSC),
      stock: parseInt(optionForm.stock) || 0,
    };
    setGroupForm((g: any) => ({ ...g, options: opts }));
    setEditingOptionIdx(null);
    setOptionForm(null);
  };

  const deleteOption = (idx: number) => {
    const opts = (groupForm.options || []).filter((_: any, i: number) => i !== idx);
    setGroupForm((g: any) => ({ ...g, options: opts }));
    if (editingOptionIdx === idx) { setEditingOptionIdx(null); setOptionForm(null); }
  };

  const filteredProducts = products.filter(p =>
    String(p.id).toLowerCase().includes(search.toLowerCase()) ||
    String(p.columnId).toLowerCase().includes(search.toLowerCase()) ||
    (p.nameKey && p.nameKey.toLowerCase().includes(search.toLowerCase()))
  );
  const filteredGroups = groups.filter(g =>
    (g.label || "").toLowerCase().includes(search.toLowerCase()) ||
    (g.category || "").toLowerCase().includes(search.toLowerCase())
  );

  // ✅ Toggle maintenance via serveur
  const toggleMaintenance = async () => {
    const newState = !maintenanceMode;
    if (!window.confirm(`${newState ? "ACTIVER" : "DÉSACTIVER"} le mode maintenance ?`)) return;
    setMaintenanceLoading(true);
    try {
      await setMaintenanceApi(newState);
      setMaintenanceMode(newState);
      toast.success(newState ? "🔧 Mode maintenance activé" : "✅ Site remis en ligne");
    } catch { toast.error("Erreur lors du changement de mode"); }
    finally { setMaintenanceLoading(false); }
  };

  const handleTranslate = async () => {
    if (!window.confirm("Traduire tous les produits personnalisés dans toutes les langues ?")) return;
    const currentProducts = await loadProducts();
    const toTranslate = currentProducts
      .filter((p: any) => p.nameKey && !p.nameKey.startsWith("prod_"))
      .map((p: any) => ({ id: p.id, name: p.nameKey }));
    if (toTranslate.length === 0) { toast.info("Aucun produit personnalisé à traduire."); return; }
    setSaving(true);
    const LANGS = ["fr","es","de","it","pt","nl","tr","ru"];
    const existing = JSON.parse(localStorage.getItem("custom_translations") || "{}");
    let done = 0;
    toast.info(`Traduction de ${toTranslate.length} produits × ${LANGS.length} langues...`);
    for (const lang of LANGS) {
      if (!existing[lang]) existing[lang] = {};
      for (const product of toTranslate) {
        try {
          const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(product.name)}&langpair=fr|${lang}`);
          const data = await res.json();
          const tr = data?.responseData?.translatedText;
          if (tr && tr !== product.name && !tr.toLowerCase().includes("mymemory")) {
            existing[lang][product.id] = tr;
          }
        } catch { /* skip */ }
        await new Promise(r => setTimeout(r, 80));
      }
      done++;
      toast.info(`${done}/${LANGS.length} langues traitées...`);
    }
    localStorage.setItem("custom_translations", JSON.stringify(existing));
    setSaving(false);
    toast.success(`✅ ${toTranslate.length} produits traduits en ${LANGS.length} langues !`);
  };

  const handleExportBackup = async () => {
    const currentProducts = await loadProducts();
    const currentGroups = await loadGroups();
    const backup = { version: 1, date: new Date().toISOString(), products: currentProducts, groups: currentGroups };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `axashop-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup téléchargé ✅");
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!window.confirm("Restaurer depuis ce backup ? Cela écrasera les données actuelles.")) return;
    try {
      const text = await file.text();
      const backup = JSON.parse(text);
      if (!backup.products || !Array.isArray(backup.products)) throw new Error("Fichier invalide");
      setSaving(true);
      const ok = await saveProducts(backup.products);
      if (ok && backup.groups) {
        for (const g of backup.groups) { await saveGroup(g); }
      }
      setSaving(false);
      if (ok) {
        setProducts(backup.products);
        const g = await loadGroups();
        setGroups(g);
        toast.success("Backup restauré ✅");
      } else {
        toast.error("Erreur lors de la restauration ❌");
      }
    } catch {
      setSaving(false);
      toast.error("Fichier backup invalide ❌");
    }
    e.target.value = "";
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tighter">Gestion des <span className="text-primary">Produits</span></h1>
            <p className="text-slate-400 font-medium">Sauvegardé en base — visible partout.</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Button onClick={toggleMaintenance} disabled={maintenanceLoading} variant="outline"
              className={`h-12 px-5 font-bold rounded-xl border transition-all ${maintenanceMode ? "border-red-500/40 text-red-400 hover:bg-red-500/10 bg-red-500/5" : "border-slate-500/30 text-slate-400 hover:bg-slate-500/10"}`}>
              {maintenanceLoading ? "..." : maintenanceMode ? "🔧 Maintenance ON" : "🔧 Maintenance OFF"}
            </Button>
            <Button onClick={handleTranslate} variant="outline"
              className="h-12 px-5 border-purple-500/30 text-purple-400 hover:bg-purple-500/10 font-bold rounded-xl">
              🌐 Traduire
            </Button>
            <Button onClick={handleExportBackup} variant="outline"
              className="h-12 px-5 border-green-500/30 text-green-400 hover:bg-green-500/10 font-bold rounded-xl">
              ⬇ Backup
            </Button>
            <label className="h-12 px-5 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 font-bold rounded-xl flex items-center cursor-pointer">
              ⬆ Restaurer
              <input type="file" accept=".json" className="hidden" onChange={handleImportBackup} />
            </label>
            <Button onClick={() => setShowSettings(!showSettings)} variant="outline"
              className="h-12 px-5 border-white/10 text-white hover:bg-white/5 font-bold rounded-xl">
              <Settings className="w-4 h-4 mr-2" />Paramètres
            </Button>
            {tab === "products" ? (
              <Button onClick={() => { setForm({ ...EMPTY_PRODUCT }); setModal("add"); }}
                className="h-12 px-5 bg-white text-black hover:bg-primary hover:text-white font-bold rounded-xl">
                <Plus className="w-4 h-4 mr-2" />Nouveau Produit
              </Button>
            ) : (
              <Button onClick={openAddGroup}
                className="h-12 px-5 bg-primary text-white font-bold rounded-xl">
                <Plus className="w-4 h-4 mr-2" />Nouveau Groupe
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-white/[0.03] border border-white/10 rounded-2xl w-fit">
          <button onClick={() => setTab("products")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${tab === "products" ? "bg-primary text-white" : "text-slate-400 hover:text-white"}`}>
            <Package className="w-4 h-4" /> Produits simples
          </button>
          <button onClick={() => setTab("groups")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${tab === "groups" ? "bg-primary text-white" : "text-slate-400 hover:text-white"}`}>
            <Layers className="w-4 h-4" /> Groupes / Cartes
          </button>
        </div>

        <AnimatePresence>
          {showSettings && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="glass-card p-6 rounded-3xl border-primary/30 bg-primary/5">
              <h2 className="text-xl font-black text-white mb-4">Paramètres Globaux</h2>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Frais Paysafecard (%)</label>
                <Input type="number" min="0" max="100" step="0.1" value={settings.pscFeePercent}
                  onChange={e => setSettingsLocal({ ...settings, pscFeePercent: parseFloat(e.target.value) })}
                  className="bg-white/5 border-white/10 max-w-xs" />
              </div>
              <div className="flex gap-2 justify-end mt-4">
                <Button variant="ghost" onClick={() => setShowSettings(false)} className="text-slate-400">Annuler</Button>
                <Button onClick={() => { saveSettings(settings); setShowSettings(false); toast.success("Paramètres mis à jour"); }} className="bg-primary text-white">Enregistrer</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <Input placeholder="Rechercher..." className="h-14 pl-12 bg-white/[0.02] border-white/10 rounded-2xl"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-slate-400">
            <RefreshCw className="w-5 h-5 animate-spin" /><span>Chargement...</span>
          </div>
        ) : tab === "products" ? (
          <div className="grid grid-cols-1 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredProducts.map(product => (
                <motion.div key={product.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="glass-card p-6 rounded-3xl border-white/[0.05] flex flex-col gap-4 group hover:border-white/10 transition-all">
                  <div className="flex items-center gap-6 flex-1">
                    <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.08] overflow-hidden shrink-0">
                      {product.image && <img src={product.image} alt="" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <span className="text-xs font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-md">{product.columnId}</span>
                        <span className="text-xs font-bold text-green-500 bg-green-500/10 px-3 py-1 rounded-md border border-green-500/20 ml-auto">Stock: {product.stock || 0}</span>
                      </div>
                      <h3 className="text-lg font-bold text-white truncate mb-2">{product.nameKey}</h3>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-2">
                          <p className="text-[8px] font-black text-blue-400 uppercase">PayPal</p>
                          <p className="text-sm font-black text-white">€{parseFloat(product.pricePayPal).toFixed(2)}</p>
                        </div>
                        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-2">
                          <p className="text-[8px] font-black text-orange-400 uppercase">LTC</p>
                          <p className="text-sm font-black text-white">€{parseFloat(product.priceLTC).toFixed(2)}</p>
                        </div>
                        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-2">
                          <p className="text-[8px] font-black text-green-400 uppercase">PSC</p>
                          <p className="text-sm font-black text-white">€{parseFloat(product.pricePSC).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 border-t border-white/10 pt-4">
                    <Button size="icon" variant="ghost" onClick={() => { setForm({ ...product }); setModal("edit"); }}
                      className="text-slate-400 hover:text-white hover:bg-white/5 rounded-xl">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(product.id)}
                      className="text-red-400 hover:bg-red-400/10 rounded-xl">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredGroups.length === 0 && (
              <div className="text-center py-16 text-slate-500">
                <Layers className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>Aucun groupe créé</p>
                <p className="text-xs mt-1">Crée une carte avec plusieurs options</p>
              </div>
            )}
            {filteredGroups.map(g => (
              <motion.div key={g.id} layout className="glass-card rounded-3xl border-white/[0.05] overflow-hidden hover:border-white/10 transition-all">
                <div className="flex items-center gap-4 p-5 cursor-pointer" onClick={() => setExpandedGroup(expandedGroup === g.id ? null : g.id)}>
                  <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.08] overflow-hidden shrink-0">
                    {g.image && <img src={g.image} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-md">{g.category}</span>
                      <span className="text-xs text-slate-500">{(g.options || []).length} option{(g.options || []).length > 1 ? "s" : ""}</span>
                    </div>
                    <h3 className="text-base font-bold text-white">{g.label}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="ghost" onClick={e => { e.stopPropagation(); openEditGroup(g); }}
                      className="text-slate-400 hover:text-white hover:bg-white/5 rounded-xl w-8 h-8">
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={e => { e.stopPropagation(); handleGroupDelete(g.id); }}
                      className="text-red-400 hover:bg-red-400/10 rounded-xl w-8 h-8">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                    {expandedGroup === g.id ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                  </div>
                </div>
                <AnimatePresence>
                  {expandedGroup === g.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-white/8">
                      <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                        {(g.options || []).map((opt: any, i: number) => (
                          <div key={i} className="bg-white/[0.02] border border-white/8 rounded-2xl p-3">
                            {opt.image && <img src={opt.image} alt="" className="w-full h-20 object-cover rounded-xl mb-2" />}
                            <p className="text-sm font-bold text-white truncate">{opt.name}</p>
                            <p className="text-xs text-blue-400 font-bold mt-1">€{parseFloat(opt.pricePayPal || 0).toFixed(2)}</p>
                            <p className="text-xs text-slate-500">Stock: {opt.stock}</p>
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
      </div>

      {/* ── MODAL PRODUIT SIMPLE ── */}
      <AnimatePresence>
        {modal && form && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setModal(null)} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40" />
            <motion.div initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 sm:inset-0 sm:flex sm:items-center sm:justify-center z-50 pointer-events-none">
              <div className="pointer-events-auto w-full sm:max-w-md bg-[#0d1117] border border-white/10 rounded-t-3xl sm:rounded-3xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-black text-white">{modal === "add" ? "➕ Nouveau produit" : "✏️ Modifier"}</h2>
                  <button onClick={() => setModal(null)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
                </div>
                <Field label="Catégorie">
                  <Input placeholder="Social, Discord, VPN..." value={form.columnId} onChange={e => setForm({ ...form, columnId: e.target.value })} className="bg-white/5 border-white/10 h-11" />
                </Field>
                <Field label="Nom du produit">
                  <Input placeholder="Netflix Premium 4K" value={form.nameKey} onChange={e => setForm({ ...form, nameKey: e.target.value })} className="bg-white/5 border-white/10 h-11" />
                </Field>
                <Field label="Description (optionnel)">
                  <Input placeholder="Compte à vie..." value={form.descKey || ""} onChange={e => setForm({ ...form, descKey: e.target.value })} className="bg-white/5 border-white/10 h-11" />
                </Field>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="💙 PayPal (€)">
                    <Input type="number" step="0.01" value={form.pricePayPal} onChange={e => setForm({ ...form, pricePayPal: e.target.value })} className="bg-blue-500/10 border-blue-500/20 h-11 text-center font-bold" />
                  </Field>
                  <Field label="🟠 LTC">
                    <Input type="number" step="0.000001" value={form.priceLTC} onChange={e => setForm({ ...form, priceLTC: e.target.value })} className="bg-orange-500/10 border-orange-500/20 h-11 text-center font-bold" />
                  </Field>
                  <Field label="💚 PSC (€)">
                    <Input type="number" step="0.01" value={form.pricePSC} onChange={e => setForm({ ...form, pricePSC: e.target.value })} className="bg-green-500/10 border-green-500/20 h-11 text-center font-bold" />
                  </Field>
                </div>
                <Field label="Stock">
                  <div className="flex gap-2">
                    <Input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} className="bg-white/5 border-white/10 h-11 flex-1" />
                    <button type="button" onClick={() => setForm({ ...form, stock: 999999 })}
                      className="px-3 h-11 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-lg hover:bg-primary/20 hover:border-primary/40 transition-all">∞</button>
                  </div>
                </Field>
                <Field label="Image">
                  <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, (v) => setForm((p: any) => ({ ...p, image: v })))} />
                  {form.image ? (
                    <div className="relative w-full h-32 rounded-xl overflow-hidden border border-white/10">
                      <img src={form.image} alt="preview" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setForm((p: any) => ({ ...p, image: "" }))} className="absolute top-2 right-2 bg-black/70 rounded-full p-1 text-white hover:bg-red-500/80"><X className="w-3.5 h-3.5" /></button>
                      <button type="button" onClick={() => imageRef.current?.click()} className="absolute bottom-2 right-2 bg-black/70 rounded-lg px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20 flex items-center gap-1.5"><Upload className="w-3 h-3" /> Changer</button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => imageRef.current?.click()} className="w-full h-20 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/15 bg-white/[0.02] text-slate-400 hover:border-primary/40 hover:text-primary transition-all">
                      <Upload className="w-5 h-5" /><span className="text-xs font-bold">Cliquer pour uploader</span>
                    </button>
                  )}
                </Field>
                <div className="flex gap-3 pt-2">
                  <Button variant="ghost" onClick={() => setModal(null)} className="flex-1 h-12 text-slate-400 border border-white/10 rounded-xl">Annuler</Button>
                  <Button onClick={modal === "add" ? handleAdd : handleSave} disabled={saving} className="flex-1 h-12 bg-primary text-white font-black rounded-xl">
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" />Sauvegarder</>}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── MODAL GROUPE ── */}
      <AnimatePresence>
        {groupModal && groupForm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setGroupModal(null); setEditingOptionIdx(null); setOptionForm(null); }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40" />
            <motion.div initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 sm:inset-0 sm:flex sm:items-center sm:justify-center z-50 pointer-events-none">
              <div className="pointer-events-auto w-full sm:max-w-lg bg-[#0d1117] border border-white/10 rounded-t-3xl sm:rounded-3xl p-6 space-y-5 max-h-[92vh] overflow-y-auto">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-black text-white">{groupModal === "add" ? "➕ Nouveau groupe" : "✏️ Modifier le groupe"}</h2>
                  <button onClick={() => { setGroupModal(null); setEditingOptionIdx(null); setOptionForm(null); }} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
                </div>
                <Field label="Nom du groupe">
                  <Input placeholder="Ex: Netflix, Disney+..." value={groupForm.label} onChange={e => setGroupForm({ ...groupForm, label: e.target.value })} className="bg-white/5 border-white/10 h-11" />
                </Field>
                <Field label="Catégorie">
                  <Input placeholder="Social, Discord, VPN..." value={groupForm.category} onChange={e => setGroupForm({ ...groupForm, category: e.target.value })} className="bg-white/5 border-white/10 h-11" />
                </Field>
                <Field label="Image de la carte">
                  <input ref={groupImageRef} type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, (v) => setGroupForm((g: any) => ({ ...g, image: v })))} />
                  {groupForm.image ? (
                    <div className="relative w-full h-28 rounded-xl overflow-hidden border border-white/10">
                      <img src={groupForm.image} alt="preview" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setGroupForm((g: any) => ({ ...g, image: "" }))} className="absolute top-2 right-2 bg-black/70 rounded-full p-1 text-white"><X className="w-3.5 h-3.5" /></button>
                      <button type="button" onClick={() => groupImageRef.current?.click()} className="absolute bottom-2 right-2 bg-black/70 rounded-lg px-3 py-1.5 text-xs font-bold text-white flex items-center gap-1.5"><Upload className="w-3 h-3" /> Changer</button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => groupImageRef.current?.click()} className="w-full h-20 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/15 bg-white/[0.02] text-slate-400 hover:border-primary/40 hover:text-primary transition-all">
                      <Upload className="w-5 h-5" /><span className="text-xs font-bold">Image principale</span>
                    </button>
                  )}
                </Field>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">Options ({(groupForm.options || []).length})</p>
                    <button onClick={addOption} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-bold hover:bg-primary/20 transition-all">
                      <Plus className="w-3 h-3" /> Ajouter option
                    </button>
                  </div>

                  {(groupForm.options || []).map((opt: any, i: number) => (
                    <div key={i} className="bg-white/[0.03] border border-white/8 rounded-2xl overflow-hidden">
                      <div className="flex items-center gap-3 p-3">
                        {opt.image && <img src={opt.image} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">{opt.name || "Sans nom"}</p>
                          <p className="text-xs text-blue-400">€{parseFloat(opt.pricePayPal || 0).toFixed(2)} — Stock: {opt.stock}</p>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => { setEditingOptionIdx(i); setOptionForm({ ...opt }); }}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => deleteOption(i)}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                      <AnimatePresence>
                        {editingOptionIdx === i && optionForm && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden border-t border-white/8">
                            <div className="p-4 space-y-3">
                              <Field label="Nom de l'option">
                                <Input placeholder="Ex: Lifetime Fan" value={optionForm.name} onChange={e => setOptionForm({ ...optionForm, name: e.target.value })} className="bg-white/5 border-white/10 h-10" />
                              </Field>
                              <div className="grid grid-cols-3 gap-2">
                                <Field label="💙 PayPal">
                                  <Input type="number" step="0.01" value={optionForm.pricePayPal} onChange={e => setOptionForm({ ...optionForm, pricePayPal: e.target.value })} className="bg-blue-500/10 border-blue-500/20 h-10 text-center font-bold" />
                                </Field>
                                <Field label="🟠 LTC">
                                  <Input type="number" step="0.000001" value={optionForm.priceLTC} onChange={e => setOptionForm({ ...optionForm, priceLTC: e.target.value })} className="bg-orange-500/10 border-orange-500/20 h-10 text-center font-bold" />
                                </Field>
                                <Field label="💚 PSC">
                                  <Input type="number" step="0.01" value={optionForm.pricePSC} onChange={e => setOptionForm({ ...optionForm, pricePSC: e.target.value })} className="bg-green-500/10 border-green-500/20 h-10 text-center font-bold" />
                                </Field>
                              </div>
                              <Field label="Stock">
                                <div className="flex gap-2">
                                  <Input type="number" value={optionForm.stock} onChange={e => setOptionForm({ ...optionForm, stock: e.target.value })} className="bg-white/5 border-white/10 h-10 flex-1" />
                                  <button type="button" onClick={() => setOptionForm({ ...optionForm, stock: 999999 })}
                                    className="px-3 h-10 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-primary/20 transition-all">∞</button>
                                </div>
                              </Field>
                              <Field label="Image">
                                <input ref={optionImageRef} type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, (v) => setOptionForm((o: any) => ({ ...o, image: v })))} />
                                {optionForm.image ? (
                                  <div className="relative w-full h-24 rounded-xl overflow-hidden border border-white/10">
                                    <img src={optionForm.image} alt="" className="w-full h-full object-cover" />
                                    <button type="button" onClick={() => setOptionForm((o: any) => ({ ...o, image: "" }))} className="absolute top-2 right-2 bg-black/70 rounded-full p-1 text-white"><X className="w-3 h-3" /></button>
                                    <button type="button" onClick={() => optionImageRef.current?.click()} className="absolute bottom-2 right-2 bg-black/70 rounded-lg px-2 py-1 text-xs text-white flex items-center gap-1"><Upload className="w-3 h-3" /> Changer</button>
                                  </div>
                                ) : (
                                  <button type="button" onClick={() => optionImageRef.current?.click()} className="w-full h-16 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/15 bg-white/[0.02] text-slate-400 hover:border-primary/40 text-xs font-bold">
                                    <Upload className="w-4 h-4" /> Uploader image
                                  </button>
                                )}
                              </Field>
                              <button onClick={saveOption} className="w-full h-10 bg-primary text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2">
                                <Save className="w-3.5 h-3.5" /> Valider l'option
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="ghost" onClick={() => { setGroupModal(null); setEditingOptionIdx(null); setOptionForm(null); }} className="flex-1 h-12 text-slate-400 border border-white/10 rounded-xl">Annuler</Button>
                  <Button onClick={handleGroupSave} disabled={saving} className="flex-1 h-12 bg-primary text-white font-black rounded-xl">
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" />Sauvegarder le groupe</>}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
