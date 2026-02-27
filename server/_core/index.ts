import "dotenv/config";
import express from "express";
import axios from "axios";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { ENV } from "./env";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { checkLtcPayments } from "../services/ltc";
import { verifyPaypalIPN } from "../services/paypal";

const log = (msg: string) => console.log(`[${new Date().toISOString()}] ${msg}`);

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  
  // Order validation endpoint (called from Discord webhook links)
  app.get("/api/order/validate", async (req: any, res: any) => {
    const { action, orderId, email, name } = req.query;

    if (!action || !orderId || !email) {
      return res.status(400).send("Paramètres manquants");
    }

    const DISCORD_WEBHOOK_URL = ENV.discordWebhookUrl;

    if (action === "accept") {
      // Envoyer un email de confirmation au client
      const confirmationMessage = {
        embeds: [{
          title: "✅ Commande Acceptée",
          description: `La commande **${orderId}** a été validée et acceptée.`,
          color: 0x22c55e, // Vert
          fields: [
            { name: "Client", value: `${name || "N/A"}\n${email}`, inline: true },
            { name: "Statut", value: "✅ Validée", inline: true }
          ],
          footer: { text: "Axa Shop - Validation Automatique" },
          timestamp: new Date().toISOString()
        }]
      };

      try {
        await axios.post(DISCORD_WEBHOOK_URL, confirmationMessage);
      } catch (e: any) {
        console.error("Erreur Discord webhook:", e.response?.data || e.message);
      }

      // TODO: Ici, vous pourriez envoyer un email au client avec ses produits
      // Pour l'instant, on affiche juste une page de confirmation
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Commande Acceptée</title>
          <style>
            body { font-family: Arial, sans-serif; background: #030711; color: white; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
            .container { text-align: center; max-width: 500px; padding: 40px; background: rgba(255,255,255,0.05); border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); }
            h1 { color: #22c55e; margin-bottom: 20px; }
            p { color: #94a3b8; line-height: 1.6; }
            .order-id { color: white; font-weight: bold; font-family: monospace; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>✅ Commande Acceptée</h1>
            <p>La commande <span class="order-id">${orderId}</span> a été validée avec succès.</p>
            <p>Le client <strong>${email}</strong> recevra ses produits par email sous peu.</p>
          </div>
        </body>
        </html>
      `);
    } else if (action === "reject") {
      // Envoyer une notification de rejet
      const rejectionMessage = {
        embeds: [{
          title: "❌ Commande Refusée",
          description: `La commande **${orderId}** a été refusée.`,
          color: 0xef4444, // Rouge
          fields: [
            { name: "Client", value: `${name || "N/A"}\n${email}`, inline: true },
            { name: "Statut", value: "❌ Refusée", inline: true }
          ],
          footer: { text: "Axa Shop - Validation Automatique" },
          timestamp: new Date().toISOString()
        }]
      };

      try {
        await axios.post(DISCORD_WEBHOOK_URL, rejectionMessage);
      } catch (e: any) {
        console.error("Erreur Discord webhook:", e.response?.data || e.message);
      }

      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Commande Refusée</title>
          <style>
            body { font-family: Arial, sans-serif; background: #030711; color: white; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
            .container { text-align: center; max-width: 500px; padding: 40px; background: rgba(255,255,255,0.05); border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); }
            h1 { color: #ef4444; margin-bottom: 20px; }
            p { color: #94a3b8; line-height: 1.6; }
            .order-id { color: white; font-weight: bold; font-family: monospace; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>❌ Commande Refusée</h1>
            <p>La commande <span class="order-id">${orderId}</span> a été refusée.</p>
            <p>Le client <strong>${email}</strong> sera notifié du refus.</p>
          </div>
        </body>
        </html>
      `);
    }

    return res.status(400).send("Action invalide");
  });
  
  // Simple HTTP endpoint for manual payment submissions
  app.post("/api/submit-order", async (req: any, res: any) => {
    try {
      const { orderId, method, buyerName, buyerEmail, items, total, paymentProof } = req.body;

      // Validation basique
      if (!orderId || !method || !buyerEmail || !items || !total) {
        return res.status(400).json({ error: "Données manquantes" });
      }

      const DISCORD_WEBHOOK_URL = ENV.discordWebhookUrl;

      // Construire le message Discord
      const headers = req.headers || {};
      const host = headers.host || 'localhost:3000';
      const protocol = headers['x-forwarded-proto'] || 'http';
      const baseUrl = `${protocol}://${host}`;

      const acceptUrl = `${baseUrl}/api/order/validate?action=accept&orderId=${orderId}&email=${encodeURIComponent(buyerEmail)}&name=${encodeURIComponent(buyerName || "Client")}`;
      const rejectUrl = `${baseUrl}/api/order/validate?action=reject&orderId=${orderId}&email=${encodeURIComponent(buyerEmail)}`;

      const embed = {
        title: `🛒 Nouvelle Commande : ${orderId}`,
        description: `Une nouvelle commande attend votre validation.`,
        color: 0x3b82f6,
        fields: [
          { name: "👤 Client (Email)", value: buyerEmail, inline: true },
          { name: "💳 Méthode", value: method.toUpperCase(), inline: true },
          { name: "💰 Total", value: total, inline: true },
          { name: "📝 Preuve / Code PIN / TXID", value: `\`\`\`${paymentProof || "N/A"}\`\`\`` },
          { name: "📦 Produits & IDs Panier", value: items.map((i: any) => `• **${i.name}** (ID: ${i.id}) x${i.quantity}`).join('\n') }
        ],
        footer: { text: "Axa Shop - Système de Paiement Manuel" },
        timestamp: new Date().toISOString()
      };

      const message = {
        content: `🔔 **Nouvelle commande reçue !**\n\n✅ [ACCEPTER](${acceptUrl})\n❌ [REFUSER](${rejectUrl})`,
        embeds: [embed]
      };

      // Envoyer à Discord
      try {
        await axios.post(DISCORD_WEBHOOK_URL, message);
      } catch (discordError: any) {
        console.error("Discord error:", discordError.response?.status, discordError.response?.data || discordError.message);
      }

      // Retourner succès
      return res.json({ success: true, orderId });
    } catch (error) {
      console.error("Erreur /api/submit-order:", error);
      return res.status(500).json({ error: "Erreur serveur" });
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
  
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  
  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Endpoint pour PayPal IPN
  app.post("/api/payments/paypal/ipn", async (req, res) => {
    // PayPal envoie les données en x-www-form-urlencoded
    await verifyPaypalIPN(req.body);
    // Toujours répondre 200 à PayPal pour éviter les renvois inutiles
    res.sendStatus(200);
  });

  // Lancer la vérification LTC toutes les 5 minutes
  setInterval(() => {
    checkLtcPayments().catch(err => console.error("[Cron LTC] Erreur:", err));
  }, 5 * 60 * 1000);

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
