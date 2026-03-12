import "dotenv/config";
import express from "express";
import axios from "axios";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../server/routers.js";
import { createContext } from "../server/_core/context.js";

const app = express();

// Configuration de base
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Middleware de log simple
app.use((req: any, res: any, next: any) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// L'URL de ton Webhook Discord
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1467183990380171304/cp8H9z5JqNG73ljKB9Jc1mbYGGwsa4u6lleOWSUcosESJeIqKyRO5y1riQcSQ-d79r2e";

// Route unique et robuste pour l'envoi de commande
app.post("/api/submit-order", async (req: any, res: any) => {
  try {
    const { orderId, method, buyerEmail, items, total, paymentProof } = req.body;

    // Déterminer l'URL de base pour les liens ACCEPTER/REFUSER
    const host = req.headers.host || 'axa-shop-6cyb.vercel.app';
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const baseUrl = `${protocol}://${host}`;

    const acceptUrl = `${baseUrl}/api/order/validate?action=accept&orderId=${orderId}&email=${encodeURIComponent(buyerEmail)}`;
    const rejectUrl = `${baseUrl}/api/order/validate?action=reject&orderId=${orderId}&email=${encodeURIComponent(buyerEmail)}`;

    // Construction du message pour Discord
    const message = {
      content: `🔔 **Nouvelle commande reçue !**\n\n> **[✅ ACCEPTER LA COMMANDE](${acceptUrl})**\n> **[❌ REFUSER LA COMMANDE](${rejectUrl})**\n\n_ _`,
      embeds: [{
        title: `🛒 Nouvelle Commande : ${orderId}`,
        description: `Une nouvelle commande attend votre validation.`,
        color: 0x3b82f6,
        fields: [
          { name: "👤 Client (Email)", value: buyerEmail || "N/A", inline: true },
          { name: "💳 Méthode", value: (method || "N/A").toUpperCase(), inline: true },
          { name: "💰 Total", value: total || "N/A", inline: true },
          { name: "📝 Preuve / Code PIN / TXID", value: `\`\`\`${paymentProof || "N/A"}\`\`\`` },
          { name: "📦 Produits & IDs Panier", value: Array.isArray(items) ? items.map((i: any) => `• **${i.name}** x${i.quantity}`).join('\n') : "N/A" }
        ],
        footer: { text: "Axa Shop - Système de Paiement Manuel" },
        timestamp: new Date().toISOString()
      }]
    };

    // Envoi à Discord via Axios pour une meilleure compatibilité Node.js
    console.log("Tentative d'envoi à Discord via Axios...");
    try {
      await axios.post(DISCORD_WEBHOOK_URL, message);
      console.log("Succès Discord");
    } catch (discordError: any) {
      console.error("Erreur Discord:", discordError.response?.status, discordError.response?.data || discordError.message);
      // On continue quand même
    }

    return res.json({ success: true });
  } catch (error: any) {
    console.error("Erreur Serveur Détaillée:", {
      message: error.message,
      stack: error.stack,
      error
    });
    return res.status(500).json({ 
      error: "Erreur interne", 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    });
  }
});

// tRPC API
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
    onError({ error, path }) {
      console.error(`[tRPC Error] ${path}:`, error);
    },
  })
);

// Route de santé
app.get("/api/health", (req: any, res: any) => {
  res.json({ status: "ok" });
});

export default app;
