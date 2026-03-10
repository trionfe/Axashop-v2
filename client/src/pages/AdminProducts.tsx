import { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit2, Trash2, Save, X, Package, Settings, Upload, Image as ImageIcon } from "lucide-react";
import { getProducts, saveProducts, getSettings, saveSettings } from "@/lib/products";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettingsLocal] = useState(getSettings());
  const addImageRef = useRef<HTMLInputElement>(null);
  const editImageRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setProducts(getProducts());
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setEditForm((prev: any) => ({ ...prev, image: ev.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    const newProducts = products.map(p => p.id === editingId ? editForm : p);
    setProducts(newProducts);
    saveProducts(newProducts);
    setEditingId(null);
    toast.success("Produit mis à jour");
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Supprimer ce produit ?")) {
      const newProducts = products.filter(p => p.id !== id);
      setProducts(newProducts);
      saveProducts(newProducts);
      toast.success("Produit supprimé");
    }
  };

  const handleAdd = () => {
    if (!editForm.nameKey || !editForm.pricePayPal || !editForm.priceLTC || !editForm.pricePSC) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    const newId = `prod-${Date.now()}`;
    const newProd = {
      ...editForm,
      id: newId,
      pricePayPal: parseFloat(editForm.pricePayPal),
      priceLTC: parseFloat(editForm.priceLTC),
      pricePSC: parseFloat(editForm.pricePSC),
      stock: parseInt(editForm.stock) || 0,
    };
    const newProducts = [newProd, ...products];
    setProducts(newProducts);
    saveProducts(newProducts);
    setIsAdding(false);
    setEditForm(null);
    toast.success("Produit ajouté");
  };

  const handleSettingsSave = () => {
    saveSettings(settings);
    setShowSettings(false);
    toast.success("Paramètres mis à jour");
  };

  const filteredProducts = products.filter(p => 
    p.id.toLowerCase().includes(search.toLowerCase()) ||
    p.columnId.toLowerCase().includes(search.toLowerCase()) ||
    (p.nameKey && p.nameKey.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <DashboardLayout>
      <div className="space-y-10 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tighter">Gestion des <span className="text-primary">Produits</span></h1>
            <p className="text-slate-400 font-medium">Ajoutez, modifiez ou supprimez vos offres numériques avec support multi-paiement.</p>
          </div>
          <div className="flex gap-4">
            <Button 
              onClick={() => setShowSettings(!showSettings)}
              variant="outline"
              className="h-12 px-6 border-white/10 text-white hover:bg-white/5 font-bold rounded-xl transition-all"
            >
              <Settings className="w-5 h-5 mr-2" />
              Paramètres
            </Button>
            <Button 
              onClick={() => {
                setIsAdding(true);
                  setEditForm({ 
                    id: "", 
                    columnId: "Social", 
                    nameKey: "", 
                    descKey: "", 
                    pricePayPal: "0", 
                    priceLTC: "0",
                    pricePSC: "0",
                    image: "",
                    stock: 29
                  });
              }}
              className="h-12 px-6 bg-white text-black hover:bg-primary hover:text-white font-bold rounded-xl transition-all shadow-xl"
            >
              <Plus className="w-5 h-5 mr-2" />
              Nouveau Produit
            </Button>
          </div>
        </div>

        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card p-6 rounded-3xl border-primary/30 bg-primary/5"
            >
              <div className="space-y-4">
                <h2 className="text-xl font-black text-white">Paramètres Globaux</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Pourcentage de frais Paysafecard (%)
                    </label>
                    <Input 
                      type="number" 
                      min="0" 
                      max="100" 
                      step="0.1"
                      value={settings.pscFeePercent} 
                      onChange={e => setSettingsLocal({ ...settings, pscFeePercent: parseFloat(e.target.value) })} 
                      className="bg-white/5 border-white/10" 
                    />
                    <p className="text-[10px] text-slate-400">
                      Frais appliqués aux prix Paysafecard (par défaut: 10%)
                    </p>
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
          <Input 
            placeholder="Rechercher par ID, Catégorie ou Nom..." 
            className="h-14 pl-12 bg-white/[0.02] border-white/10 rounded-2xl focus:ring-primary/20 focus:border-primary/30 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence mode="popLayout">
            {isAdding && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-card p-6 rounded-3xl border-primary/30 bg-primary/5"
              >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 mb-4">
                    <Input placeholder="Catégorie" value={editForm.columnId} onChange={e => setEditForm({...editForm, columnId: e.target.value})} className="bg-white/5 border-white/10" />
                    <Input placeholder="Clé Nom" value={editForm.nameKey} onChange={e => setEditForm({...editForm, nameKey: e.target.value})} className="bg-white/5 border-white/10" />
                    <Input placeholder="Prix PayPal (EUR)" type="number" step="0.01" value={editForm.pricePayPal} onChange={e => setEditForm({...editForm, pricePayPal: e.target.value})} className="bg-white/5 border-white/10" />
                    <Input placeholder="Prix LTC" type="number" step="0.000001" value={editForm.priceLTC} onChange={e => setEditForm({...editForm, priceLTC: e.target.value})} className="bg-white/5 border-white/10" />
                    <Input placeholder="Prix PSC (EUR)" type="number" step="0.01" value={editForm.pricePSC} onChange={e => setEditForm({...editForm, pricePSC: e.target.value})} className="bg-white/5 border-white/10" />
                    <Input placeholder="Stock" type="number" value={editForm.stock} onChange={e => setEditForm({...editForm, stock: e.target.value})} className="bg-white/5 border-white/10" />
                    <div className="flex flex-col gap-2">
                      <input ref={addImageRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      <button
                        type="button"
                        onClick={() => addImageRef.current?.click()}
                        className="h-10 w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/5 text-xs font-bold text-slate-300 hover:border-primary/50 hover:text-primary transition-all"
                      >
                        <Upload className="w-4 h-4" />
                        {editForm.image ? "Changer l'image" : "Télécharger une image"}
                      </button>
                      {editForm.image && (
                        <div className="relative w-full h-16 rounded-xl overflow-hidden border border-white/10">
                          <img src={editForm.image} alt="preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setEditForm((p: any) => ({ ...p, image: "" }))}
                            className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 text-white hover:bg-red-500/80 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" onClick={() => setIsAdding(false)} className="text-slate-400">Annuler</Button>
                  <Button onClick={handleAdd} className="bg-primary text-white">Confirmer l'ajout</Button>
                </div>
              </motion.div>
            )}

            {filteredProducts.map((product) => (
              <motion.div 
                key={product.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card p-6 rounded-3xl border-white/[0.05] flex flex-col gap-4 group hover:border-white/10 transition-all"
              >
                {editingId === product.id ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
                      <Input value={editForm.columnId} onChange={e => setEditForm({...editForm, columnId: e.target.value})} className="bg-white/5 border-white/10" placeholder="Catégorie" />
                      <Input value={editForm.nameKey} onChange={e => setEditForm({...editForm, nameKey: e.target.value})} className="bg-white/5 border-white/10" placeholder="Clé Nom" />
                      <Input type="number" step="0.01" value={editForm.pricePayPal} onChange={e => setEditForm({...editForm, pricePayPal: e.target.value})} className="bg-white/5 border-white/10" placeholder="Prix PayPal" />
                      <Input type="number" step="0.000001" value={editForm.priceLTC} onChange={e => setEditForm({...editForm, priceLTC: e.target.value})} className="bg-white/5 border-white/10" placeholder="Prix LTC" />
                      <Input type="number" step="0.01" value={editForm.pricePSC} onChange={e => setEditForm({...editForm, pricePSC: e.target.value})} className="bg-white/5 border-white/10" placeholder="Prix PSC" />
                      <Input type="number" value={editForm.stock} onChange={e => setEditForm({...editForm, stock: e.target.value})} className="bg-white/5 border-white/10" placeholder="Stock" />
                      <div className="flex flex-col gap-2">
                        <input ref={editImageRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        <button
                          type="button"
                          onClick={() => editImageRef.current?.click()}
                          className="h-10 w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/5 text-xs font-bold text-slate-300 hover:border-primary/50 hover:text-primary transition-all"
                        >
                          <Upload className="w-4 h-4" />
                          {editForm.image ? "Changer l'image" : "Télécharger une image"}
                        </button>
                        {editForm.image && (
                          <div className="relative w-full h-16 rounded-xl overflow-hidden border border-white/10">
                            <img src={editForm.image} alt="preview" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setEditForm((p: any) => ({ ...p, image: "" }))}
                              className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 text-white hover:bg-red-500/80 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button size="icon" onClick={handleSave} className="bg-green-500/20 text-green-500 hover:bg-green-500 hover:text-white rounded-xl">
                        <Save className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setEditingId(null)} className="text-slate-500 hover:bg-white/5 rounded-xl">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-6 flex-1">
                      <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.08] overflow-hidden shrink-0">
                        <img src={product.image} alt="" className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-xs font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-md">{product.columnId}</span>
                          <span className="text-[10px] font-bold text-slate-500 truncate">ID: {product.id}</span>
                          <span className="text-xs font-bold text-green-500 bg-green-500/10 px-3 py-1 rounded-md ml-auto border border-green-500/20">Stock: {product.stock || 0}</span>
                        </div>
                        <h3 className="text-lg font-bold text-white truncate mb-2">{product.nameKey}</h3>
                        
                        {/* Prix Display */}
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
                      <Button size="icon" variant="ghost" onClick={() => { setEditingId(product.id); setEditForm(product); }} className="text-slate-400 hover:text-white hover:bg-white/5 rounded-xl">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(product.id)} className="text-red-400 hover:bg-red-400/10 rounded-xl">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
}
