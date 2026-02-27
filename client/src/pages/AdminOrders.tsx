import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Search, CheckCircle, XCircle, Clock, Mail, ExternalLink, Package, User, CreditCard, FileText, Send } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminOrders() {
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [deliveryText, setDeliveryText] = useState("");
  const [deliveryFileUrl, setDeliveryFileUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: orders, refetch } = trpc.adminGetOrders.useQuery();
  const updateOrderMutation = trpc.adminUpdateOrder.useMutation({
    onSuccess: () => {
      toast.success("Commande mise à jour");
      refetch();
      setSelectedOrder(null);
      setDeliveryText("");
      setDeliveryFileUrl("");
    },
    onError: (err) => {
      toast.error("Erreur : " + err.message);
    }
  });

  const handleUpdateStatus = async (orderId: string, status: string) => {
    if (status === 'completed' && !deliveryText && !deliveryFileUrl) {
      toast.error("Veuillez fournir un message ou un fichier pour la livraison");
      return;
    }

    setIsProcessing(true);
    try {
      await updateOrderMutation.mutateAsync({
        orderId,
        status,
        deliveryData: status === 'completed' ? {
          text: deliveryText,
          fileUrl: deliveryFileUrl
        } : undefined
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredOrders = orders?.filter((o: any) => 
    o.id.toLowerCase().includes(search.toLowerCase()) ||
    o.buyerEmail.toLowerCase().includes(search.toLowerCase()) ||
    o.method?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'rejected': return 'text-red-500 bg-red-500/10 border-red-500/20';
      default: return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-10 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tighter">Gestion des <span className="text-primary">Commandes</span></h1>
            <p className="text-slate-400 font-medium">Validez les paiements et livrez les produits à vos clients.</p>
          </div>
        </div>

        <div className="relative group max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Rechercher par ID, Email ou Méthode..." 
            className="h-14 pl-12 bg-white/[0.02] border-white/10 rounded-2xl focus:ring-primary/20 focus:border-primary/30 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 gap-4">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-20 glass-card rounded-3xl border-white/[0.05]">
              <Clock className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">Aucune commande trouvée.</p>
            </div>
          ) : (
            filteredOrders.map((order: any) => (
              <motion.div 
                key={order.id}
                layout
                className="glass-card p-6 rounded-3xl border-white/[0.05] hover:border-white/10 transition-all"
              >
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-black text-white">{order.id}</span>
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md border ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleString()}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-3 text-sm">
                        <User className="w-4 h-4 text-primary" />
                        <div className="truncate">
                          <p className="text-[10px] font-black text-slate-500 uppercase">Client</p>
                          <p className="text-white font-bold truncate">{order.buyerEmail}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <CreditCard className="w-4 h-4 text-primary" />
                        <div>
                          <p className="text-[10px] font-black text-slate-500 uppercase">Paiement</p>
                          <p className="text-white font-bold">{order.method?.toUpperCase()} - {order.total}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Package className="w-4 h-4 text-primary" />
                        <div>
                          <p className="text-[10px] font-black text-slate-500 uppercase">Produits</p>
                          <p className="text-white font-bold">{order.items?.length || 0} article(s)</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                      <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Preuve de paiement / Code PIN</p>
                      <code className="text-xs text-blue-400 break-all">{order.paymentProof || "N/A"}</code>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row lg:flex-col gap-2 justify-center min-w-[200px]">
                    {order.status === 'pending' ? (
                      <>
                        <Button 
                          onClick={() => setSelectedOrder(order)}
                          className="bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl h-12"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Accepter & Livrer
                        </Button>
                        <Button 
                          onClick={() => handleUpdateStatus(order.id, 'rejected')}
                          variant="outline"
                          className="border-red-500/30 text-red-500 hover:bg-red-500/10 font-bold rounded-xl h-12"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Refuser
                        </Button>
                      </>
                    ) : (
                      <div className="text-center p-4">
                        <p className="text-[10px] font-black text-slate-500 uppercase">Action effectuée</p>
                        <p className="text-xs text-slate-400 mt-1">Le {new Date(order.updatedAt).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Modal de Livraison */}
        <AnimatePresence>
          {selectedOrder && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-2xl glass-card p-8 rounded-[2.5rem] border-white/[0.05] relative"
              >
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="absolute top-6 right-6 text-slate-500 hover:text-white"
                >
                  <XCircle className="w-6 h-6" />
                </button>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black">Livraison de la commande</h2>
                    <p className="text-slate-400 text-sm">Commande : <span className="text-white font-mono">{selectedOrder.id}</span></p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Message au client (Comptes, Clés, Instructions...)</label>
                      <Textarea 
                        placeholder="Entrez les informations à livrer ici..."
                        className="min-h-[150px] bg-white/[0.02] border-white/10 rounded-2xl focus:ring-primary/20"
                        value={deliveryText}
                        onChange={(e) => setDeliveryText(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Lien du fichier (Optionnel)</label>
                      <Input 
                        placeholder="https://exemple.com/mon-fichier.zip"
                        className="h-12 bg-white/[0.02] border-white/10 rounded-xl"
                        value={deliveryFileUrl}
                        onChange={(e) => setDeliveryFileUrl(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <Button 
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'completed')}
                      disabled={isProcessing}
                      className="flex-1 h-14 bg-primary hover:bg-primary/90 text-white font-black rounded-2xl shadow-xl"
                    >
                      {isProcessing ? "Envoi en cours..." : (
                        <>
                          <Send className="w-5 h-5 mr-2" />
                          Confirmer & Envoyer par Mail
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-center text-[10px] text-slate-500 font-bold uppercase">Un email sera automatiquement envoyé à {selectedOrder.buyerEmail}</p>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
