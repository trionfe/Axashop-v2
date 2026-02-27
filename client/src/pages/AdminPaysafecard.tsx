import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, X, Clock, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface PaysafecardCode {
  id: string;
  code: string;
  amount: number;
  buyerEmail: string;
  orderId: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: Date;
  notes?: string;
}

export default function AdminPaysafecard() {
  const [codes, setCodes] = useState<PaysafecardCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    // Fetch pending codes from API
    fetchPendingCodes();
  }, []);

  const fetchPendingCodes = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await trpc.admin.paysafecard.getPendingCodes.query();
      // setCodes(response);
      setCodes([]); // Placeholder
    } catch (error) {
      toast.error("Erreur lors du chargement des codes");
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async (codeId: string, isValid: boolean) => {
    try {
      // TODO: Replace with actual API call
      // await trpc.admin.paysafecard.validateCode.mutate({
      //   codeId,
      //   isValid,
      //   notes,
      // });

      toast.success(
        isValid
          ? "Code approuvé et email envoyé à l'acheteur"
          : "Code rejeté et email envoyé à l'acheteur"
      );

      setSelectedCode(null);
      setNotes("");
      fetchPendingCodes();
    } catch (error) {
      toast.error("Erreur lors de la validation");
    }
  };

  const pendingCodes = codes.filter((c) => c.status === "pending");
  const approvedCodes = codes.filter((c) => c.status === "approved");
  const rejectedCodes = codes.filter((c) => c.status === "rejected");

  return (
    <DashboardLayout>
      <div className="space-y-10 py-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tighter">
            Gestion <span className="text-primary">Paysafecard</span>
          </h1>
          <p className="text-slate-400 font-medium">
            Validez les codes Paysafecard soumis par les clients.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card p-6 rounded-2xl border-white/[0.05]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  En attente
                </p>
                <p className="text-3xl font-black text-white mt-2">
                  {pendingCodes.length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500 opacity-50" />
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl border-white/[0.05]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Approuvés
                </p>
                <p className="text-3xl font-black text-white mt-2">
                  {approvedCodes.length}
                </p>
              </div>
              <Check className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl border-white/[0.05]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Rejetés
                </p>
                <p className="text-3xl font-black text-white mt-2">
                  {rejectedCodes.length}
                </p>
              </div>
              <X className="w-8 h-8 text-red-500 opacity-50" />
            </div>
          </div>
        </div>

        {/* Pending Codes */}
        <div className="space-y-4">
          <h2 className="text-2xl font-black text-white">Codes en attente</h2>

          {loading ? (
            <div className="text-center py-12 text-slate-400">Chargement...</div>
          ) : pendingCodes.length === 0 ? (
            <div className="glass-card p-12 rounded-2xl border-white/[0.05] text-center">
              <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">Aucun code en attente de validation</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {pendingCodes.map((code) => (
                <motion.div
                  key={code.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="glass-card p-6 rounded-2xl border-yellow-500/30 bg-yellow-500/5"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Code
                      </p>
                      <p className="text-lg font-black text-white font-mono">
                        {code.code}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Montant
                      </p>
                      <p className="text-lg font-black text-white">
                        €{code.amount.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Email
                      </p>
                      <p className="text-sm text-slate-300">{code.buyerEmail}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Commande
                      </p>
                      <p className="text-sm text-slate-300">{code.orderId}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Soumis
                      </p>
                      <p className="text-sm text-slate-300">
                        {new Date(code.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {selectedCode === code.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-white/10 pt-4 mt-4 space-y-4"
                    >
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">
                          Notes (optionnel)
                        </label>
                        <Input
                          placeholder="Raison du rejet ou commentaires..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="bg-white/5 border-white/10"
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setSelectedCode(null);
                            setNotes("");
                          }}
                          className="text-slate-400"
                        >
                          Annuler
                        </Button>
                        <Button
                          onClick={() => handleValidate(code.id, false)}
                          className="bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Rejeter
                        </Button>
                        <Button
                          onClick={() => handleValidate(code.id, true)}
                          className="bg-green-500/20 text-green-500 hover:bg-green-500 hover:text-white"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Approuver
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {selectedCode !== code.id && (
                    <Button
                      onClick={() => setSelectedCode(code.id)}
                      className="w-full bg-primary text-white hover:bg-primary/90 rounded-xl"
                    >
                      Valider ce code
                    </Button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Approved Codes */}
        {approvedCodes.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-black text-white">Codes approuvés</h2>
            <div className="space-y-2">
              {approvedCodes.map((code) => (
                <div
                  key={code.id}
                  className="glass-card p-4 rounded-xl border-green-500/30 bg-green-500/5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <Check className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="font-black text-white">{code.code}</p>
                      <p className="text-[10px] text-slate-400">
                        €{code.amount.toFixed(2)} • {code.buyerEmail}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-green-500 uppercase">
                    Approuvé
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rejected Codes */}
        {rejectedCodes.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-black text-white">Codes rejetés</h2>
            <div className="space-y-2">
              {rejectedCodes.map((code) => (
                <div
                  key={code.id}
                  className="glass-card p-4 rounded-xl border-red-500/30 bg-red-500/5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <X className="w-5 h-5 text-red-500" />
                    <div>
                      <p className="font-black text-white">{code.code}</p>
                      <p className="text-[10px] text-slate-400">
                        €{code.amount.toFixed(2)} • {code.buyerEmail}
                      </p>
                      {code.notes && (
                        <p className="text-[10px] text-red-400 mt-1">
                          Raison: {code.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-red-500 uppercase">
                    Rejeté
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
