import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { MessageSquare, Trash2, Star, Loader2, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function AdminReviews() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [, setLocation] = useLocation();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const { data: reviews, isLoading, refetch } = trpc.adminGetReviews.useQuery();
  const deleteReviewMutation = trpc.adminDeleteReview.useMutation();

  useEffect(() => {
    const authStatus = localStorage.getItem("admin_auth");
    if (authStatus !== "true") {
      setLocation("/admin");
    } else {
      setIsAuthenticated(true);
    }
  }, [setLocation]);

  const handleDelete = async (id: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet avis ?")) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteReviewMutation.mutateAsync({ id });
      toast.success("Avis supprimé avec succès");
      refetch();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
      console.error(error);
    } finally {
      setDeletingId(null);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-10 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tighter">
              Gestion des <span className="text-primary">Avis</span>
            </h1>
            <p className="text-slate-400 font-medium">
              Gérez les avis clients et modérez le contenu.
            </p>
          </div>
          <Button
            onClick={() => setLocation("/admin")}
            variant="outline"
            className="h-12 px-6 border-white/10 text-white hover:bg-white/5 font-bold rounded-xl transition-all"
          >
            Retour au Dashboard
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 rounded-3xl border-white/[0.05] flex items-center justify-between"
          >
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Total Avis
              </p>
              <p className="text-2xl font-black text-white">
                {reviews?.length || 0}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6 rounded-3xl border-white/[0.05] flex items-center justify-between"
          >
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Note Moyenne
              </p>
              <p className="text-2xl font-black text-white">
                {reviews && reviews.length > 0
                  ? (reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / reviews.length).toFixed(1)
                  : '0.0'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center">
              <Star className="w-5 h-5 text-yellow-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6 rounded-3xl border-white/[0.05] flex items-center justify-between"
          >
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Avis Approuvés
              </p>
              <p className="text-2xl font-black text-white">
                {reviews?.length || 0}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-green-500" />
            </div>
          </motion.div>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-primary" />
            Tous les avis
          </h2>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : reviews && reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review: any, index: number) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-card p-6 rounded-[2rem] border-white/[0.05]"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                    <div className="flex-grow space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-blue-500/20 border border-white/10 flex items-center justify-center font-bold text-primary">
                            {review.userName ? review.userName[0].toUpperCase() : '?'}
                          </div>
                          <div>
                            <p className="font-bold text-white">{review.userName}</p>
                            <p className="text-[10px] text-slate-500">{review.userEmail}</p>
                          </div>
                        </div>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-4 h-4 ${
                                s <= review.rating
                                  ? 'fill-yellow-500 text-yellow-500'
                                  : 'text-slate-600'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm text-slate-400">
                          Produit: <span className="text-white font-semibold">{review.productName}</span>
                        </p>
                        <p className="text-slate-300 italic">"{review.comment}"</p>
                      </div>

                      <p className="text-[10px] text-slate-500">
                        Publié le {formatDate(review.createdAt)}
                      </p>
                    </div>

                    <div className="flex lg:flex-col gap-3">
                      <Button
                        onClick={() => handleDelete(review.id)}
                        disabled={deletingId === review.id}
                        variant="destructive"
                        className="h-10 px-4 rounded-xl font-bold"
                      >
                        {deletingId === review.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Supprimer
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="glass-card p-20 rounded-[2rem] border-white/[0.05] text-center">
              <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">Aucun avis pour le moment</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
