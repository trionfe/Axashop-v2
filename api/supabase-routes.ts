/**
 * ROUTES SUPABASE SÉCURISÉES — côté serveur uniquement
 * 
 * Ce fichier contient toutes les routes /api/supabase/* qui remplacent
 * les appels directs depuis le client. La clé Supabase n'est plus jamais
 * exposée dans le bundle JavaScript public.
 * 
 * À ajouter dans api/index.ts AVANT export default app
 */

import express from "express";
import axios from "axios";

// ─── Middleware auth admin (à importer depuis ton système existant) ────────────
// Cette fonction vérifie que la requête vient d'un admin connecté
async function requireAdmin(req: any, res: any, next: any) {
  try {
    // Vérifier le cookie de session existant (JWT)
    const { sdk } = await import("../server/_core/sdk.js");
    const { COOKIE_NAME } = await import("../shared/const.js");
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) return res.status(401).json({ error: "Non authentifié" });

    const session = await sdk.verifySession(token);
    if (!session?.openId) return res.status(401).json({ error: "Session invalide" });

    // Vérifier le rôle admin dans la DB
    const { getUserByOpenId } = await import("../server/db.js");
    const user = await getUserByOpenId(session.openId);
    if (user?.role !== "admin" && session.openId !== "admin-session") {
      return res.status(403).json({ error: "Accès admin requis" });
    }

    req.adminUser = user;
    next();
  } catch (e) {
    return res.status(401).json({ error: "Authentification échouée" });
  }
}

export function registerSupabaseRoutes(app: express.Application) {
  // ─── Helpers internes ──────────────────────────────────────────────────────
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; // Clé SERVICE_ROLE (jamais exposée)

  function supabaseHeaders() {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      throw new Error("SUPABASE_URL et SUPABASE_SERVICE_KEY doivent être définis dans .env");
    }
    return {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
    };
  }

  function supabase(path: string) {
    if (!SUPABASE_URL) throw new Error("SUPABASE_URL manquant");
    return `${SUPABASE_URL}/rest/v1${path}`;
  }

  // ─── VISITORS (admin seulement) ────────────────────────────────────────────

  // GET /api/supabase/visitors — liste les visiteurs (admin)
  app.get("/api/supabase/visitors", requireAdmin, async (_req, res) => {
    try {
      const { data } = await axios.get(
        supabase("/Visitors?select=*&order=visited_at.desc&limit=500"),
        { headers: supabaseHeaders() }
      );
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // DELETE /api/supabase/visitors/:id (admin)
  app.delete("/api/supabase/visitors/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "ID invalide" });
      await axios.delete(supabase(`/Visitors?id=eq.${id}`), { headers: supabaseHeaders() });
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // DELETE /api/supabase/visitors (admin, vider tout)
  app.delete("/api/supabase/visitors", requireAdmin, async (_req, res) => {
    try {
      await axios.delete(supabase("/Visitors?id=gt.0"), { headers: supabaseHeaders() });
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ─── TRACK VISIT (public, rate-limité) ────────────────────────────────────
  // Simple in-memory rate limiter par IP pour éviter le spam
  const visitRateLimit = new Map<string, number>();
  setInterval(() => visitRateLimit.clear(), 60_000); // Reset toutes les minutes

  app.post("/api/track-visit", async (req, res) => {
    try {
      const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim()
        || req.socket.remoteAddress
        || "unknown";

      // Max 5 requêtes par minute par IP
      const count = visitRateLimit.get(ip) || 0;
      if (count >= 5) return res.status(429).json({ error: "Trop de requêtes" });
      visitRateLimit.set(ip, count + 1);

      const body = req.body;
      // Valider les champs minimum requis
      if (typeof body !== "object" || !body.page) {
        return res.status(400).json({ error: "Données invalides" });
      }

      // Sanitize: on accepte seulement les champs connus
      const allowed = [
        "ip","country","country_code","city","region","isp","connection_type",
        "is_vpn","browser","browser_version","os","device","language","screen",
        "color_depth","timezone","page","referrer","referrer_full","session_id",
        "ram","cpu","network_type","network_speed","is_private","has_adblock",
        "tab_hidden","visited_at"
      ];
      const sanitized: Record<string, any> = {};
      for (const key of allowed) {
        if (key in body) sanitized[key] = body[key];
      }

      await axios.post(supabase("/Visitors"), sanitized, {
        headers: { ...supabaseHeaders(), Prefer: "return=minimal" },
      });
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ─── PRODUCTS (lecture publique, écriture admin) ───────────────────────────

  // GET /api/supabase/products — lecture publique (pas de clé exposée)
  app.get("/api/supabase/products", async (_req, res) => {
    try {
      const { data } = await axios.get(
        supabase("/Products?select=*&order=id.asc"),
        { headers: supabaseHeaders() }
      );
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // PATCH /api/supabase/products (admin)
  app.patch("/api/supabase/products", requireAdmin, async (req, res) => {
    try {
      const { data: rows } = await axios.get(
        supabase("/Products?select=id&limit=1"),
        { headers: supabaseHeaders() }
      );
      const body = req.body;
      if (rows?.length > 0) {
        await axios.patch(supabase(`/Products?id=eq.${rows[0].id}`), body, {
          headers: { ...supabaseHeaders(), Prefer: "return=minimal" },
        });
      } else {
        await axios.post(supabase("/Products"), body, {
          headers: { ...supabaseHeaders(), Prefer: "return=minimal" },
        });
      }
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ─── GROUPS (lecture publique, écriture admin) ─────────────────────────────

  app.get("/api/supabase/groups", async (_req, res) => {
    try {
      const { data } = await axios.get(
        supabase("/Groups?select=*&order=id.asc"),
        { headers: supabaseHeaders() }
      );
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/supabase/groups/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "ID invalide" });
      const { data } = await axios.get(
        supabase(`/Groups?id=eq.${id}&select=*`),
        { headers: supabaseHeaders() }
      );
      res.json(data?.[0] || null);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/supabase/groups", requireAdmin, async (req, res) => {
    try {
      await axios.post(supabase("/Groups"), req.body, {
        headers: { ...supabaseHeaders(), Prefer: "return=minimal" },
      });
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.patch("/api/supabase/groups/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "ID invalide" });
      await axios.patch(supabase(`/Groups?id=eq.${id}`), req.body, {
        headers: { ...supabaseHeaders(), Prefer: "return=minimal" },
      });
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/supabase/groups/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "ID invalide" });
      await axios.delete(supabase(`/Groups?id=eq.${id}`), { headers: supabaseHeaders() });
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ─── SETTINGS (lecture publique, écriture admin) ───────────────────────────

  app.get("/api/supabase/settings/maintenance", async (_req, res) => {
    try {
      const { data } = await axios.get(
        supabase("/Settings?key=eq.maintenance&select=value&limit=1"),
        { headers: supabaseHeaders() }
      );
      res.json({ maintenance: data?.[0]?.value === "true" });
    } catch {
      res.json({ maintenance: false });
    }
  });

  app.post("/api/supabase/settings/maintenance", requireAdmin, async (req, res) => {
    try {
      const { enabled } = req.body;
      const { data: rows } = await axios.get(
        supabase("/Settings?key=eq.maintenance&select=id&limit=1"),
        { headers: supabaseHeaders() }
      );
      const value = enabled ? "true" : "false";
      if (rows?.length > 0) {
        await axios.patch(supabase("/Settings?key=eq.maintenance"), { value }, {
          headers: { ...supabaseHeaders(), Prefer: "return=minimal" },
        });
      } else {
        await axios.post(supabase("/Settings"), { key: "maintenance", value }, {
          headers: { ...supabaseHeaders(), Prefer: "return=minimal" },
        });
      }
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
}
