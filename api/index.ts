import "dotenv/config";
import express from "express";
import axios from "axios";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../server/routers.js";
import { createContext } from "../server/_core/context.js";
import { registerNeonRoutes } from "./neon-routes.js";

const app = express();

// ─── Security headers ──────────────────────────────────────────────────────────
app.use((_req, res, next) => {
  // Empêche le navigateur de deviner le type MIME
  res.setHeader("X-Content-Type-Options", "nosniff");
  // Empêche l'embedding dans des iframes étrangers (clickjacking)
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  // Désactive l'ancien XSS filter (remplacé par CSP)
  res.setHeader("X-XSS-Protection", "0");
  // Ne pas exposer le framework
  res.removeHeader("X-Powered-By");
  next();
});

app.use(express.json({ limit: "10mb" })); // Réduit de 50mb → 10mb (anti-DoS)
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// ─── Simple in-memory rate limiter global ─────────────────────────────────────
const globalRateLimit = new Map<string, { count: number; ts: number }>();
setInterval(() => globalRateLimit.clear(), 60_000);

function rateLimit(maxPerMinute = 30) {
  return (req: any, res: any, next: any) => {
    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      "unknown";
    const key = `${ip}:${req.path}`;
    const now = Date.now();
    const entry = globalRateLimit.get(key);
    if (!entry || now - entry.ts > 60_000) {
      globalRateLimit.set(key, { count: 1, ts: now });
      return next();
    }
    entry.count++;
    if (entry.count > maxPerMinute) {
      return res.status(429).json({ error: "Trop de requêtes. Réessaie dans 1 minute." });
    }
    next();
  };
}

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// ─── Helper Discord (jamais exposé au client) ─────────────────────────────────
function getDiscordWebhook(): string {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) throw new Error("DISCORD_WEBHOOK_URL non configuré dans les variables d'environnement");
  return url;
}

// ─── Order validation (liens Discord) ────────────────────────────────────────
// Note : ces liens sont envoyés UNIQUEMENT dans Discord, pas exposés publiquement
app.get("/api/order/validate", rateLimit(10), async (req, res) => {
  const { action, orderId, email, name } = req.query;
  if (!action || !orderId || !email) {
    return res.status(400).send("Paramètres manquants");
  }

  // Valider que action est bien "accept" ou "reject"
  if (action !== "accept" && action !== "reject") {
    return res.status(400).send("Action invalide");
  }

  const color = action === "accept" ? 0x22c55e : 0xef4444;
  const label = action === "accept" ? "✅ Acceptée" : "❌ Refusée";

  try {
    await axios.post(getDiscordWebhook(), {
      embeds: [
        {
          title: `${label} — Commande ${orderId}`,
          color,
          fields: [{ name: "Client", value: String(email) }],
          timestamp: new Date().toISOString(),
        },
      ],
    });
  } catch (e) {
    console.error("[Discord] Webhook error:", e);
  }

  res.send(
    `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Commande ${label}</title>` +
    `<style>body{font-family:Arial,sans-serif;background:#030711;color:white;display:flex;` +
    `justify-content:center;align-items:center;height:100vh;margin:0}` +
    `.container{text-align:center;padding:40px;background:rgba(255,255,255,.05);` +
    `border-radius:20px;border:1px solid rgba(255,255,255,.1)}</style></head>` +
    `<body><div class="container"><h1>${label}</h1>` +
    `<p>Commande <strong>${String(orderId).replace(/[<>"]/g, "")}</strong></p>` +
    `<p>${String(email).replace(/[<>"]/g, "")}</p></div></body></html>`
  );
});

// ─── Submit order ─────────────────────────────────────────────────────────────
app.post("/api/submit-order", rateLimit(5), async (req, res) => {
  try {
    const { orderId, method, buyerName, buyerEmail, items, total, paymentProof } = req.body;

    // Validation basique
    if (!orderId || !buyerEmail || !method) {
      return res.status(400).json({ error: "Champs requis manquants" });
    }
    if (typeof buyerEmail !== "string" || !buyerEmail.includes("@")) {
      return res.status(400).json({ error: "Email invalide" });
    }

    // L'URL de base provient des headers Vercel (jamais du body client)
    const host = req.headers.host || "axashop-v2-a2of.vercel.app";
    const protocol = (req.headers["x-forwarded-proto"] as string) || "https";
    const baseUrl = `${protocol}://${host}`;
    const acceptUrl = `${baseUrl}/api/order/validate?action=accept&orderId=${encodeURIComponent(orderId)}&email=${encodeURIComponent(buyerEmail)}&name=${encodeURIComponent(buyerName || "")}`;
    const rejectUrl = `${baseUrl}/api/order/validate?action=reject&orderId=${encodeURIComponent(orderId)}&email=${encodeURIComponent(buyerEmail)}`;

    await axios.post(getDiscordWebhook(), {
      content: `🔔 **Nouvelle commande !**\n\n✅ [ACCEPTER](${acceptUrl})\n❌ [REFUSER](${rejectUrl})`,
      embeds: [
        {
          title: `🛒 Commande : ${orderId}`,
          color: 0x3b82f6,
          fields: [
            { name: "👤 Client", value: String(buyerEmail), inline: true },
            { name: "💳 Méthode", value: String(method).toUpperCase(), inline: true },
            { name: "💰 Total", value: String(total || "N/A"), inline: true },
            { name: "📝 Preuve", value: `\`\`\`${String(paymentProof || "N/A").slice(0, 500)}\`\`\`` },
            {
              name: "📦 Produits",
              value: Array.isArray(items)
                ? items.map((i: any) => `• **${String(i.name || "?")}** x${Number(i.quantity) || 1}`).join("\n")
                : "N/A",
            },
          ],
          timestamp: new Date().toISOString(),
        },
      ],
    });

    return res.json({ success: true });
  } catch (error: any) {
    console.error("[submit-order]", error.message);
    return res.status(500).json({ error: "Erreur interne" });
    // ⚠️ Ne jamais exposer error.message au client en production
  }
});

// ─── Traduction produits (serveur uniquement) ──────────────────────────────────
app.post("/api/translate", rateLimit(20), async (req, res) => {
  try {
    const { products } = req.body;
    if (!products || !Array.isArray(products)) {
      return res.status(400).json({ error: "Tableau de produits invalide" });
    }
    if (products.length > 100) {
      return res.status(400).json({ error: "Trop de produits (max 100)" });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Clé API traduction non configurée" });
    }

    const response = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4000,
        messages: [
          {
            role: "user",
            content: `Translate these product names into French (fr), Spanish (es), German (de), Italian (it), Portuguese (pt), Dutch (nl), Turkish (tr), Russian (ru), Arabic (ar).\nReturn ONLY valid JSON without any markdown:\n{"fr":{"PRODUCT_ID":"translated name"},"es":{...},...}\nProducts: ${JSON.stringify(products)}`,
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
      }
    );

    const text = response.data.content?.[0]?.text || "";
    const match = text.replace(/```json|```/g, "").trim().match(/\{[\s\S]*\}/);
    if (!match) return res.status(500).json({ error: "Pas de JSON dans la réponse" });

    res.json({ translations: JSON.parse(match[0]) });
  } catch (err: any) {
    console.error("[translate]", err.message);
    res.status(500).json({ error: "Erreur de traduction" });
  }
});

// ─── Routes Neon (remplacent Supabase) ────────────────────────────────────────
registerNeonRoutes(app);

// ─── tRPC ─────────────────────────────────────────────────────────────────────
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
    onError({ error, path }) {
      console.error(`[tRPC Error] ${path}:`, error.message);
      // Ne jamais logger le stack en production
    },
  })
);

export default app;
