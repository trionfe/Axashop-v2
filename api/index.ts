import "dotenv/config";
import express from "express";
import axios from "axios";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../server/routers.js";
import { createContext } from "../server/_core/context.js";

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Order validation (Discord links)
app.get("/api/order/validate", async (req: any, res: any) => {
  const { action, orderId, email, name } = req.query;
  if (!action || !orderId || !email) return res.status(400).send("Paramètres manquants");

  const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || "https://discord.com/api/webhooks/1467183990380171304/cp8H9z5JqNG73ljKB9Jc1mbYGGwsa4u6lleOWSUcosESJeIqKyRO5y1riQcSQ-d79r2e";

  const color = action === "accept" ? 0x22c55e : 0xef4444;
  const label = action === "accept" ? "✅ Acceptée" : "❌ Refusée";

  try {
    await axios.post(DISCORD_WEBHOOK_URL, {
      embeds: [{ title: `${label} — Commande ${orderId}`, color, fields: [{ name: "Client", value: String(email) }], timestamp: new Date().toISOString() }]
    });
  } catch (e) {}

  res.send(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Commande ${label}</title><style>body{font-family:Arial,sans-serif;background:#030711;color:white;display:flex;justify-content:center;align-items:center;height:100vh;margin:0}.container{text-align:center;padding:40px;background:rgba(255,255,255,.05);border-radius:20px;border:1px solid rgba(255,255,255,.1)}</style></head><body><div class="container"><h1>${label}</h1><p>Commande <strong>${orderId}</strong></p><p>${email}</p></div></body></html>`);
});

// Submit order
app.post("/api/submit-order", async (req: any, res: any) => {
  try {
    const { orderId, method, buyerName, buyerEmail, items, total, paymentProof } = req.body;
    const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || "https://discord.com/api/webhooks/1467183990380171304/cp8H9z5JqNG73ljKB9Jc1mbYGGwsa4u6lleOWSUcosESJeIqKyRO5y1riQcSQ-d79r2e";
    const host = req.headers.host || 'axashop-v2-a2of.vercel.app';
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const baseUrl = `${protocol}://${host}`;
    const acceptUrl = `${baseUrl}/api/order/validate?action=accept&orderId=${orderId}&email=${encodeURIComponent(buyerEmail)}&name=${encodeURIComponent(buyerName || "")}`;
    const rejectUrl = `${baseUrl}/api/order/validate?action=reject&orderId=${orderId}&email=${encodeURIComponent(buyerEmail)}`;

    try {
      await axios.post(DISCORD_WEBHOOK_URL, {
        content: `🔔 **Nouvelle commande !**\n\n✅ [ACCEPTER](${acceptUrl})\n❌ [REFUSER](${rejectUrl})`,
        embeds: [{
          title: `🛒 Commande : ${orderId}`,
          color: 0x3b82f6,
          fields: [
            { name: "👤 Client", value: buyerEmail || "N/A", inline: true },
            { name: "💳 Méthode", value: (method || "N/A").toUpperCase(), inline: true },
            { name: "💰 Total", value: total || "N/A", inline: true },
            { name: "📝 Preuve", value: `\`\`\`${paymentProof || "N/A"}\`\`\`` },
            { name: "📦 Produits", value: Array.isArray(items) ? items.map((i: any) => `• **${i.name}** x${i.quantity}`).join('\n') : "N/A" }
          ],
          timestamp: new Date().toISOString()
        }]
      });
    } catch (e) {}

    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: "Erreur interne", details: error.message });
  }
});

// tRPC
app.use("/api/trpc", createExpressMiddleware({
  router: appRouter,
  createContext,
  onError({ error, path }) {
    console.error(`[tRPC Error] ${path}:`, error);
  },
}));

export default app;
