import { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit2, Trash2, Save, X, Settings, Upload } from "lucide-react";
import { getProducts, saveProducts, getSettings, saveSettings } from "@/lib/products";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">{label}</p>
      {children}
    </div>
  );
}

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettingsLocal] = useState(getSettings());
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [form, setForm] = useState<any>(null);
  const imageRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setProducts(getProducts());
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setForm((p: any) => ({ ...p, image: ev.target?.result as string }));
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    const newProducts = products.map(p => p.id === form.id ? {
      ...form,
      pricePayPal: parseFloat(form.pricePayPal),
      priceLTC: parseFloat(form.priceLTC),
      pricePSC: parseFloat(form.pricePSC),
      stock: parseInt(form.stock) || 0,
    } : p);
    setProducts(newProducts);
    saveProducts(newProducts);
    setModal(null);
    toast.success("Produit mis à jour ✅");
  };

  const handleAdd = () => {
    if (!form.nameKey || !form.pricePayPal) {
      toast.error("Veuillez remplir au moins le nom et le prix PayPal");
      return;
    }
    const newProd = {
      ...form,
      id: `prod-${Date.now()}`,
      pricePayPal: parseFloat(form.pricePayPal),
      priceLTC: parseFloat(form.priceLTC),
      pricePSC: parseFloat(form.pricePSC),
      stock: parseInt(form.stock) || 0,
    };
    const newProducts = [newProd, ...products];
    setProducts(newProducts);
    saveProducts(newProducts);
    setModal(null);
    toast.success("Produit ajouté ✅");
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Supprimer ce produit ?")) {
      const newProducts = products.filter(p => p.id !== id);
      setProducts(newProducts);
      saveProducts(newProducts);
      toast.success("Produit supprimé");
    }
  };

  const handleSettingsSave = () => {
    saveSettings(settings);
    setShowSettings(false);
    toast.success("Paramètres mis à jour");
  };

  const openEdit = (product: any) => {
    setForm({ ...product });
    setModal("edit");
  };

  const openAdd = () => {
    setForm({ id: "", columnId: "Social", nameKey: "", descKey: "", pricePayPal: "0", priceLTC: "0", pricePSC: "0", image: "", stock: 29 });
    setModal("add");
  };

  const filteredProducts = products.filter(p =>
    String(p.id).toLowerCase().includes(search.toLowerCase()) ||
    String(p.columnId).toLowerCase().includes(search.toLowerCase()) ||
    (p.nameKey && p.nameKey.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <DashboardLayout>
      <div className="space-y-10 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tighter">Gestion des <span className="text-primary">Produits</span></h1>
            <p className="text-slate-400 font-medium">Ajoutez, modifiez ou supprimez vos offres numériques.</p>
          </div>
          <div className="flex gap-4">
            <Button onClick={() => setShowSettings(!showSettings)} variant="outline"
              className="h-12 px-6 border-white/10 text-white hover:bg-white/5 font-bold rounded-xl">
              <Settings className="w-5 h-5 mr-2" />
              Paramètres
            </Button>
            <Button onClick={openAdd}
              className="h-12 px-6 bg-white text-black hover:bg-primary hover:text-white font-bold rounded-xl shadow-xl">
              <Plus className="w-5 h-5 mr-2" />
              Nouveau Produit
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {showSettings && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card p-6 rounded-3xl border-primary/30 bg-primary/5">
              <div className="space-y-4">
                <h2 className="text-xl font-black text-white">Paramètres Globaux</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Pourcentage de frais Paysafecard (%)
                    </label>
                    <Input type="number" min="0" max="100" step="0.1"
                      value={settings.pscFeePercent}
                      onChange={e => setSettingsLocal({ ...settings, pscFeePercent: parseFloat(e.target.value) })}
                      className="bg-white/5 border-white/10" />
                    <p className="text-[10px] text-slate-400">Frais appliqués aux prix Paysafecard (par défaut: 10%)</p>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" onClick={() => setShowSettings(false)} className="text-slate-400">Annuler</Button>
                  <Button onClick={handleSettingsSave} className="bg-primary text-white">Enregistrer</Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative group max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-primary transition-colors" />
          <Input placeholder="Rechercher par ID, Catégorie ou Nom..."
            className="h-14 pl-12 bg-white/[0.02] border-white/10 rounded-2xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product) => (
              <motion.div key={product.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="glass-card p-6 rounded-3xl border-white/[0.05] flex flex-col gap-4 group hover:border-white/10 transition-all">
                <div className="flex items-center gap-6 flex-1">
                  <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.08] overflow-hidden shrink-0">
                    {product.image && <img src={product.image} alt="" className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <span className="text-xs font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-md">{product.columnId}</span>
                      <span className="text-[10px] font-bold text-slate-500 truncate">ID: {product.id}</span>
                      <span className="text-xs font-bold text-green-500 bg-green-500/10 px-3 py-1 rounded-md ml-auto border border-green-500/20">Stock: {product.stock || 0}</span>
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
                <div className="flex items-center gap-2 shrink-0 border-t border-white/10 pt-4">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(product)}
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
      </div>

      {/* MODAL */}
      <AnimatePresence>
        {modal && form && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setModal(null)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40" />
            <motion.div
              initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 sm:inset-0 sm:flex sm:items-center sm:justify-center z-50 pointer-events-none"
            >
              <div className="pointer-events-auto w-full sm:max-w-md bg-[#0d1117] border border-white/10 rounded-t-3xl sm:rounded-3xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-black text-white">
                    {modal === "add" ? "➕ Nouveau produit" : "✏️ Modifier le produit"}
                  </h2>
                  <button onClick={() => setModal(null)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <Field label="Catégorie">
                  <Input placeholder="Ex: Social, Discord, VPN..."
                    value={form.columnId} onChange={e => setForm({ ...form, columnId: e.target.value })}
                    className="bg-white/5 border-white/10 h-11" />
                </Field>

                <Field label="Nom du produit">
                  <Input placeholder="Ex: Netflix Premium 4K"
                    value={form.nameKey} onChange={e => setForm({ ...form, nameKey: e.target.value })}
                    className="bg-white/5 border-white/10 h-11" />
                </Field>

                <Field label="Description (optionnel)">
                  <Input placeholder="Ex: Compte à vie, accès complet..."
                    value={form.descKey || ""} onChange={e => setForm({ ...form, descKey: e.target.value })}
                    className="bg-white/5 border-white/10 h-11" />
                </Field>

                <div className="grid grid-cols-3 gap-3">
                  <Field label="💙 PayPal (€)">
                    <Input type="number" step="0.01" value={form.pricePayPal}
                      onChange={e => setForm({ ...form, pricePayPal: e.target.value })}
                      className="bg-blue-500/10 border-blue-500/20 h-11 text-center font-bold" />
                  </Field>
                  <Field label="🟠 LTC">
                    <Input type="number" step="0.000001" value={form.priceLTC}
                      onChange={e => setForm({ ...form, priceLTC: e.target.value })}
                      className="bg-orange-500/10 border-orange-500/20 h-11 text-center font-bold" />
                  </Field>
                  <Field label="💚 PSC (€)">
                    <Input type="number" step="0.01" value={form.pricePSC}
                      onChange={e => setForm({ ...form, pricePSC: e.target.value })}
                      className="bg-green-500/10 border-green-500/20 h-11 text-center font-bold" />
                  </Field>
                </div>

                <Field label="Stock">
                  <Input type="number" value={form.stock}
                    onChange={e => setForm({ ...form, stock: e.target.value })}
                    className="bg-white/5 border-white/10 h-11" />
                </Field>

                <Field label="Image">
                  <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  {form.image ? (
                    <div className="relative w-full h-32 rounded-xl overflow-hidden border border-white/10">
                      <img src={form.image} alt="preview" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setForm((p: any) => ({ ...p, image: "" }))}
                        className="absolute top-2 right-2 bg-black/70 rounded-full p-1 text-white hover:bg-red-500/80">
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={() => imageRef.current?.click()}
                        className="absolute bottom-2 right-2 bg-black/70 rounded-lg px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20 flex items-center gap-1.5">
                        <Upload className="w-3 h-3" /> Changer
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => imageRef.current?.click()}
                      className="w-full h-20 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/15 bg-white/[0.02] text-slate-400 hover:border-primary/40 hover:text-primary transition-all">
                      <Upload className="w-5 h-5" />
                      <span className="text-xs font-bold">Cliquer pour uploader</span>
                    </button>
                  )}
                </Field>

                <div className="flex gap-3 pt-2">
                  <Button variant="ghost" onClick={() => setModal(null)}
                    className="flex-1 h-12 text-slate-400 border border-white/10 rounded-xl">
                    Annuler
                  </Button>
                  <Button onClick={modal === "add" ? handleAdd : handleSave}
                    className="flex-1 h-12 bg-primary text-white font-black rounded-xl">
                    <Save className="w-4 h-4 mr-2" /> Sauvegarder
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
