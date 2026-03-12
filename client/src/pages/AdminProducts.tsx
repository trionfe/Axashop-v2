import { useState, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit2, Trash2, Save, X, Settings, Upload, FolderPlus, ChevronDown, ChevronUp } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const EMPTY_PRODUCT = {
  columnId: 0,
  nameKey: "",
  descKey: "",
  pricePayPal: "0",
  priceLTC: "0",
  pricePSC: "0",
  image: "",
  stock: 29,
};

export default function AdminProducts() {
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [addForm, setAddForm] = useState<any>({ ...EMPTY_PRODUCT });
  const [showSettings, setShowSettings] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const addImageRef = useRef<HTMLInputElement>(null);
  const editImageRef = useRef<HTMLInputElement>(null);

  // ── tRPC queries ──
  const { data: products = [], refetch: refetchProducts } = trpc.adminGetProducts.useQuery();
  const { data: columns = [], refetch: refetchColumns } = trpc.adminGetColumns.useQuery();

  // ── tRPC mutations ──
  const createProduct = trpc.adminCreateProduct.useMutation({
    onSuccess: () => { toast.success("Produit ajouté ✅"); refetchProducts(); setIsAdding(false); setAddForm({ ...EMPTY_PRODUCT }); },
    onError: (e) => toast.error("Erreur : " + e.message),
  });
  const updateProduct = trpc.adminUpdateProduct.useMutation({
    onSuccess: () => { toast.success("Produit mis à jour ✅"); refetchProducts(); setEditingId(null); },
    onError: (e) => toast.error("Erreur : " + e.message),
  });
  const deleteProduct = trpc.adminDeleteProduct.useMutation({
    onSuccess: () => { toast.success("Produit supprimé"); refetchProducts(); },
    onError: (e) => toast.error("Erreur : " + e.message),
  });
  const createColumn = trpc.adminCreateColumn.useMutation({
    onSuccess: () => { toast.success("Catégorie créée ✅"); refetchColumns(); setNewCategoryName(""); },
    onError: (e) => toast.error("Erreur : " + e.message),
  });
  const deleteColumn = trpc.adminDeleteColumn.useMutation({
    onSuccess: () => { toast.success("Catégorie supprimée"); refetchColumns(); },
    onError: (e) => toast.error("Erreur : " + e.message),
  });

  // ── Image upload → base64 ──
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, target: "add" | "edit") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const val = ev.target?.result as string;
      if (target === "add") setAddForm((p: any) => ({ ...p, image: val }));
      else setEditForm((p: any) => ({ ...p, image: val }));
    };
    reader.readAsDataURL(file);
  };

  const handleAdd = () => {
    if (!addForm.nameKey || !addForm.pricePayPal || !addForm.columnId) {
      toast.error("Remplis au moins le nom, le prix PayPal et la catégorie");
      return;
    }
    createProduct.mutate({
      ...addForm,
      columnId: Number(addForm.columnId),
      stock: Number(addForm.stock) || 0,
    });
  };

  const handleSave = () => {
    if (!editForm) return;
    updateProduct.mutate({
      id: editForm.id,
      columnId: Number(editForm.columnId),
      nameKey: editForm.nameKey,
      descKey: editForm.descKey,
      pricePayPal: String(editForm.pricePayPal),
      priceLTC: String(editForm.priceLTC),
      pricePSC: String(editForm.pricePSC),
      image: editForm.image,
      stock: Number(editForm.stock),
    });
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Supprimer ce produit ?")) deleteProduct.mutate({ id });
  };

  const filteredProducts = products.filter((p: any) =>
    String(p.id).includes(search) ||
    String(p.nameKey).toLowerCase().includes(search.toLowerCase()) ||
    String(p.columnId).toLowerCase().includes(search.toLowerCase())
  );

  const getColumnName = (colId: number) =>
    columns.find((c: any) => c.id === colId)?.name || String(colId);

  return (
    <DashboardLayout>
      <div className="space-y-10 py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tighter">Gestion des <span className="text-primary">Produits</span></h1>
            <p className="text-slate-400 font-medium">Les modifications sont sauvegardées sur le serveur et visibles immédiatement.</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Button onClick={() => setShowCategories(!showCategories)} variant="outline"
              className="h-12 px-5 border-white/10 text-white hover:bg-white/5 font-bold rounded-xl">
              <FolderPlus className="w-4 h-4 mr-2" />
              Catégories {showCategories ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
            </Button>
            <Button onClick={() => { setIsAdding(true); setAddForm({ ...EMPTY_PRODUCT, columnId: columns[0]?.id || 0 }); }}
              className="h-12 px-6 bg-white text-black hover:bg-primary hover:text-white font-bold rounded-xl shadow-xl">
              <Plus className="w-5 h-5 mr-2" />
              Nouveau Produit
            </Button>
          </div>
        </div>

        {/* Catégories Panel */}
        <AnimatePresence>
          {showCategories && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="glass-card p-6 rounded-3xl border-primary/20 bg-primary/5 space-y-4">
              <h2 className="text-lg font-black text-white">Catégories</h2>
              <div className="flex flex-wrap gap-3">
                {columns.map((col: any) => (
                  <div key={col.id} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-sm font-bold text-white">{col.name}</span>
                    <button onClick={() => { if (window.confirm(`Supprimer la catégorie "${col.name}" ?`)) deleteColumn.mutate({ id: col.id }); }}
                      className="text-red-400 hover:text-red-300 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 max-w-sm">
                <Input placeholder="Nom de la catégorie..."
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  className="bg-white/5 border-white/10"
                  onKeyDown={e => e.key === "Enter" && newCategoryName.trim() && createColumn.mutate({ name: newCategoryName.trim(), displayOrder: columns.length + 1 })}
                />
                <Button onClick={() => newCategoryName.trim() && createColumn.mutate({ name: newCategoryName.trim(), displayOrder: columns.length + 1 })}
                  className="bg-primary text-white shrink-0">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search */}
        <div className="relative group max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-primary transition-colors" />
          <Input placeholder="Rechercher par nom, catégorie..."
            className="h-14 pl-12 bg-white/[0.02] border-white/10 rounded-2xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence mode="popLayout">

            {/* Add form */}
            {isAdding && (
              <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="glass-card p-6 rounded-3xl border-primary/30 bg-primary/5">
                <p className="text-xs font-black uppercase tracking-widest text-primary mb-4">Nouveau produit</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  {/* Catégorie */}
                  <select value={addForm.columnId} onChange={e => setAddForm({ ...addForm, columnId: Number(e.target.value) })}
                    className="h-10 rounded-xl bg-white/5 border border-white/10 text-white text-sm px-3">
                    <option value={0} disabled>Catégorie...</option>
                    {columns.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <Input placeholder="Nom du produit" value={addForm.nameKey} onChange={e => setAddForm({ ...addForm, nameKey: e.target.value })} className="bg-white/5 border-white/10" />
                  <Input placeholder="Description" value={addForm.descKey} onChange={e => setAddForm({ ...addForm, descKey: e.target.value })} className="bg-white/5 border-white/10" />
                  <Input placeholder="Stock" type="number" value={addForm.stock} onChange={e => setAddForm({ ...addForm, stock: e.target.value })} className="bg-white/5 border-white/10" />
                  <Input placeholder="Prix PayPal (€)" type="number" step="0.01" value={addForm.pricePayPal} onChange={e => setAddForm({ ...addForm, pricePayPal: e.target.value })} className="bg-white/5 border-white/10" />
                  <Input placeholder="Prix LTC" type="number" step="0.000001" value={addForm.priceLTC} onChange={e => setAddForm({ ...addForm, priceLTC: e.target.value })} className="bg-white/5 border-white/10" />
                  <Input placeholder="Prix PSC (€)" type="number" step="0.01" value={addForm.pricePSC} onChange={e => setAddForm({ ...addForm, pricePSC: e.target.value })} className="bg-white/5 border-white/10" />
                  {/* Image upload */}
                  <div className="flex flex-col gap-2">
                    <input ref={addImageRef} type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, "add")} />
                    <button type="button" onClick={() => addImageRef.current?.click()}
                      className="h-10 w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/5 text-xs font-bold text-slate-300 hover:border-primary/50 hover:text-primary transition-all">
                      <Upload className="w-4 h-4" />
                      {addForm.image ? "Changer l'image" : "Télécharger une image"}
                    </button>
                    {addForm.image && (
                      <div className="relative w-full h-14 rounded-xl overflow-hidden border border-white/10">
                        <img src={addForm.image} alt="preview" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => setAddForm((p: any) => ({ ...p, image: "" }))}
                          className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 text-white hover:bg-red-500/80">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" onClick={() => setIsAdding(false)} className="text-slate-400">Annuler</Button>
                  <Button onClick={handleAdd} disabled={createProduct.isPending} className="bg-primary text-white">
                    {createProduct.isPending ? "Ajout..." : "Confirmer l'ajout"}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Product list */}
            {filteredProducts.map((product: any) => (
              <motion.div key={product.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="glass-card p-6 rounded-3xl border-white/[0.05] flex flex-col gap-4 group hover:border-white/10 transition-all">
                {editingId === product.id ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <select value={editForm.columnId} onChange={e => setEditForm({ ...editForm, columnId: Number(e.target.value) })}
                        className="h-10 rounded-xl bg-white/5 border border-white/10 text-white text-sm px-3">
                        {columns.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <Input value={editForm.nameKey} onChange={e => setEditForm({ ...editForm, nameKey: e.target.value })} className="bg-white/5 border-white/10" placeholder="Nom" />
                      <Input value={editForm.descKey || ""} onChange={e => setEditForm({ ...editForm, descKey: e.target.value })} className="bg-white/5 border-white/10" placeholder="Description" />
                      <Input type="number" value={editForm.stock} onChange={e => setEditForm({ ...editForm, stock: e.target.value })} className="bg-white/5 border-white/10" placeholder="Stock" />
                      <Input type="number" step="0.01" value={editForm.pricePayPal} onChange={e => setEditForm({ ...editForm, pricePayPal: e.target.value })} className="bg-white/5 border-white/10" placeholder="Prix PayPal" />
                      <Input type="number" step="0.000001" value={editForm.priceLTC} onChange={e => setEditForm({ ...editForm, priceLTC: e.target.value })} className="bg-white/5 border-white/10" placeholder="Prix LTC" />
                      <Input type="number" step="0.01" value={editForm.pricePSC} onChange={e => setEditForm({ ...editForm, pricePSC: e.target.value })} className="bg-white/5 border-white/10" placeholder="Prix PSC" />
                      <div className="flex flex-col gap-2">
                        <input ref={editImageRef} type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, "edit")} />
                        <button type="button" onClick={() => editImageRef.current?.click()}
                          className="h-10 w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/5 text-xs font-bold text-slate-300 hover:border-primary/50 hover:text-primary transition-all">
                          <Upload className="w-4 h-4" />
                          {editForm.image ? "Changer l'image" : "Ajouter une image"}
                        </button>
                        {editForm.image && (
                          <div className="relative w-full h-14 rounded-xl overflow-hidden border border-white/10">
                            <img src={editForm.image} alt="preview" className="w-full h-full object-cover" />
                            <button type="button" onClick={() => setEditForm((p: any) => ({ ...p, image: "" }))}
                              className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 text-white hover:bg-red-500/80">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button size="icon" onClick={handleSave} disabled={updateProduct.isPending}
                        className="bg-green-500/20 text-green-500 hover:bg-green-500 hover:text-white rounded-xl">
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
                        {product.image && <img src={product.image} alt="" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                          <span className="text-xs font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                            {getColumnName(product.columnId)}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500">ID: {product.id}</span>
                          <span className="text-xs font-bold text-green-500 bg-green-500/10 px-3 py-1 rounded-md ml-auto border border-green-500/20">
                            Stock: {product.stock || 0}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-white truncate mb-2">{product.nameKey}</h3>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-2">
                            <p className="text-[8px] font-black text-blue-400 uppercase">PayPal</p>
                            <p className="text-sm font-black text-white">€{parseFloat(product.pricePayPal).toFixed(2)}</p>
                          </div>
                          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-2">
                            <p className="text-[8px] font-black text-orange-400 uppercase">LTC</p>
                            <p className="text-sm font-black text-white">{parseFloat(product.priceLTC).toFixed(6)}</p>
                          </div>
                          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-2">
                            <p className="text-[8px] font-black text-green-400 uppercase">PSC</p>
                            <p className="text-sm font-black text-white">€{parseFloat(product.pricePSC).toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 border-t border-white/10 pt-4">
                      <Button size="icon" variant="ghost" onClick={() => { setEditingId(product.id); setEditForm({ ...product }); }}
                        className="text-slate-400 hover:text-white hover:bg-white/5 rounded-xl">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(product.id)}
                        className="text-red-400 hover:bg-red-400/10 rounded-xl">
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
