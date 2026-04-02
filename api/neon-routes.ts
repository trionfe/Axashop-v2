// @ts-nocheck
/**
 * ROUTES NEON SÉCURISÉES — remplace supabase-routes.ts
 *
 * Migration Supabase → Neon (PostgreSQL standard)
 * La connexion DB se fait côté serveur uniquement via DATABASE_URL
 * Aucune clé n'est jamais exposée dans le bundle client.
 *
 * Setup Neon :
 *  1. Crée un projet sur https://neon.tech
 *  2. Copie la connection string dans NEON_DATABASE_URL dans tes variables Vercel
 *  3. Lance `npm run db:migrate` pour créer les tables
 */

import express from "express";
import { Pool } from "@neondatabase/serverless";

// ─── Middleware auth admin (JWT cookie — inchangé) ────────────────────────────
async function requireAdmin(req: any, res: any, next: any) {
  try {
    const { sdk } = await import("../server/_core/sdk.js");
    const { COOKIE_NAME } = await import("../shared/const.js");
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) return res.status(401).json({ error: "Non authentifié" });

    const session = await sdk.verifySession(token);
    if (!session?.openId) return res.status(401).json({ error: "Session invalide" });

    const { getUserByOpenId } = await import("../server/db.js");
    const user = await getUserByOpenId(session.openId);

    if (user?.role !== "admin" && session.openId !== "admin-session") {
      return res.status(403).json({ error: "Accès admin requis" });
    }

    req.adminUser = user;
    next();
  } catch {
    return res.status(401).json({ error: "Authentification échouée" });
  }
}

// ─── Neon pool (serverless-safe) ──────────────────────────────────────────────
function getPool(): Pool {
  const url = process.env.NEON_DATABASE_URL;
  if (!url) throw new Error("NEON_DATABASE_URL non défini dans les variables d'environnement");
  return new Pool({ connectionString: url });
}

// ─── Rate limiter visiteurs ────────────────────────────────────────────────────
const visitRateLimit = new Map<string, number>();
setInterval(() => visitRateLimit.clear(), 60_000);

export function registerNeonRoutes(app: express.Application) {
  // ─── VISITORS ──────────────────────────────────────────────────────────────

  // GET /api/neon/visitors — liste (admin)
  app.get("/api/neon/visitors", requireAdmin, async (_req, res) => {
    try {
      const pool = getPool();
      const { rows } = await pool.query(
        "SELECT * FROM visitors ORDER BY visited_at DESC LIMIT 500"
      );
      res.json(rows);
    } catch (e: any) {
      console.error("[neon/visitors]", e.message);
      res.status(500).json({ error: "Erreur base de données" });
    }
  });

  // DELETE /api/neon/visitors/:id (admin)
  app.delete("/api/neon/visitors/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "ID invalide" });
      const pool = getPool();
      await pool.query("DELETE FROM visitors WHERE id = $1", [id]);
      res.json({ success: true });
    } catch (e: any) {
      console.error("[neon/visitors/:id DELETE]", e.message);
      res.status(500).json({ error: "Erreur base de données" });
    }
  });

  // DELETE /api/neon/visitors — vider tout (admin)
  app.delete("/api/neon/visitors", requireAdmin, async (_req, res) => {
    try {
      const pool = getPool();
      await pool.query("TRUNCATE TABLE visitors");
      res.json({ success: true });
    } catch (e: any) {
      console.error("[neon/visitors TRUNCATE]", e.message);
      res.status(500).json({ error: "Erreur base de données" });
    }
  });

  // ─── TRACK VISIT (public, rate-limité) ────────────────────────────────────
  app.post("/api/track-visit", async (req, res) => {
    try {
      const ip =
        (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
        req.socket.remoteAddress ||
        "unknown";

      const count = visitRateLimit.get(ip) || 0;
      if (count >= 5) return res.status(429).json({ error: "Trop de requêtes" });
      visitRateLimit.set(ip, count + 1);

      const body = req.body;
      if (typeof body !== "object" || !body.page) {
        return res.status(400).json({ error: "Données invalides" });
      }

      // Champs autorisés uniquement
      const allowed = [
        "ip", "country", "country_code", "city", "region", "isp", "connection_type",
        "is_vpn", "browser", "browser_version", "os", "device", "language", "screen",
        "color_depth", "timezone", "page", "referrer", "referrer_full", "session_id",
        "ram", "cpu", "network_type", "network_speed", "is_private", "has_adblock",
        "tab_hidden", "visited_at",
      ];

      const cols: string[] = [];
      const vals: any[] = [];
      let i = 1;
      for (const key of allowed) {
        if (key in body) {
          cols.push(key);
          vals.push(body[key]);
          i++;
        }
      }

      if (cols.length === 0) return res.status(400).json({ error: "Aucun champ valide" });

      const pool = getPool();
      const placeholders = vals.map((_, idx) => `$${idx + 1}`).join(", ");
      await pool.query(
        `INSERT INTO visitors (${cols.join(", ")}) VALUES (${placeholders})`,
        vals
      );

      res.json({ success: true });
    } catch (e: any) {
      console.error("[track-visit]", e.message);
      res.status(500).json({ error: "Erreur base de données" });
    }
  });

  // ─── PRODUCTS (lecture publique, écriture admin) ───────────────────────────

  app.get("/api/neon/products", async (_req, res) => {
    try {
      const pool = getPool();
      const { rows } = await pool.query("SELECT * FROM products ORDER BY id ASC");
      res.json(rows);
    } catch (e: any) {
      console.error("[neon/products GET]", e.message);
      res.status(500).json({ error: "Erreur base de données" });
    }
  });

  app.patch("/api/neon/products/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "ID invalide" });

      const allowed = ["name", "description", "price", "category", "is_visible", "image_url"];
      const sets: string[] = [];
      const vals: any[] = [];
      let i = 1;
      for (const key of allowed) {
        if (key in req.body) {
          sets.push(`${key} = $${i}`);
          vals.push(req.body[key]);
          i++;
        }
      }
      if (sets.length === 0) return res.status(400).json({ error: "Aucun champ à mettre à jour" });

      vals.push(id);
      const pool = getPool();
      await pool.query(
        `UPDATE products SET ${sets.join(", ")}, updated_at = NOW() WHERE id = $${i}`,
        vals
      );
      res.json({ success: true });
    } catch (e: any) {
      console.error("[neon/products PATCH]", e.message);
      res.status(500).json({ error: "Erreur base de données" });
    }
  });

  // ─── GROUPS (lecture publique, écriture admin) ─────────────────────────────

  app.get("/api/neon/groups", async (_req, res) => {
    try {
      const pool = getPool();
      const { rows } = await pool.query("SELECT * FROM groups ORDER BY id ASC");
      res.json(rows);
    } catch (e: any) {
      console.error("[neon/groups GET]", e.message);
      res.status(500).json({ error: "Erreur base de données" });
    }
  });

  app.get("/api/neon/groups/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "ID invalide" });
      const pool = getPool();
      const { rows } = await pool.query("SELECT * FROM groups WHERE id = $1", [id]);
      res.json(rows[0] || null);
    } catch (e: any) {
      console.error("[neon/groups/:id GET]", e.message);
      res.status(500).json({ error: "Erreur base de données" });
    }
  });

  app.post("/api/neon/groups", requireAdmin, async (req, res) => {
    try {
      const { label, category } = req.body;
      if (!label) return res.status(400).json({ error: "label requis" });
      const pool = getPool();
      await pool.query(
        "INSERT INTO groups (label, category, created_at) VALUES ($1, $2, NOW())",
        [String(label), category ? String(category) : null]
      );
      res.json({ success: true });
    } catch (e: any) {
      console.error("[neon/groups POST]", e.message);
      res.status(500).json({ error: "Erreur base de données" });
    }
  });

  app.patch("/api/neon/groups/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "ID invalide" });

      const allowed = ["label", "category"];
      const sets: string[] = [];
      const vals: any[] = [];
      let i = 1;
      for (const key of allowed) {
        if (key in req.body) {
          sets.push(`${key} = $${i}`);
          vals.push(req.body[key]);
          i++;
        }
      }
      if (sets.length === 0) return res.status(400).json({ error: "Aucun champ valide" });

      vals.push(id);
      const pool = getPool();
      await pool.query(`UPDATE groups SET ${sets.join(", ")} WHERE id = $${i}`, vals);
      res.json({ success: true });
    } catch (e: any) {
      console.error("[neon/groups PATCH]", e.message);
      res.status(500).json({ error: "Erreur base de données" });
    }
  });

  app.delete("/api/neon/groups/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "ID invalide" });
      const pool = getPool();
      await pool.query("DELETE FROM groups WHERE id = $1", [id]);
      res.json({ success: true });
    } catch (e: any) {
      console.error("[neon/groups DELETE]", e.message);
      res.status(500).json({ error: "Erreur base de données" });
    }
  });

  // ─── SETTINGS ──────────────────────────────────────────────────────────────

  app.get("/api/neon/settings/maintenance", async (_req, res) => {
    try {
      const pool = getPool();
      const { rows } = await pool.query(
        "SELECT value FROM settings WHERE key = 'maintenance' LIMIT 1"
      );
      res.json({ maintenance: rows[0]?.value === "true" });
    } catch {
      res.json({ maintenance: false });
    }
  });

  app.post("/api/neon/settings/maintenance", requireAdmin, async (req, res) => {
    try {
      const { enabled } = req.body;
      const value = enabled ? "true" : "false";
      const pool = getPool();
      await pool.query(
        `INSERT INTO settings (key, value) VALUES ('maintenance', $1)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
        [value]
      );
      res.json({ success: true });
    } catch (e: any) {
      console.error("[neon/settings PATCH]", e.message);
      res.status(500).json({ error: "Erreur base de données" });
    }
  });
}
