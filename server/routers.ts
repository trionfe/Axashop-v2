import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import axios from "axios";
import * as db from "./db";
import { ENV } from "./_core/env";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { paysafecardRouter } from "./routers/paysafecard";

// Admin procedure - only accessible by admins
const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user?.role !== 'admin') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Admin access required',
    });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  
  // Auth routes
  getMe: publicProcedure.query(async ({ ctx }) => {
    if (ctx.user) return ctx.user;
    return null;
  }),
  
  logout: publicProcedure.mutation(async ({ ctx }) => {
    const { COOKIE_NAME } = await import("@shared/const");
    const cookieOptions = getSessionCookieOptions(ctx.req);
    (ctx.res as any).clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true } as const;
  }),
  
  adminLogin: publicProcedure
    .input(z.object({ password: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { sdk } = await import("./_core/sdk");
      const { ONE_YEAR_MS, COOKIE_NAME } = await import("@shared/const");
      const { getSessionCookieOptions } = await import("./_core/cookies");

      const adminPassword = "(À/'Ùô8 ̧ÿÛ|íXHá»à.9,ÄÌäÃoQ?E£μ{èIL£&qä¢'H";

      if (input.password !== adminPassword) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid admin password",
        });
      }

      const user = {
        openId: "admin-session",
        name: "Administrator",
        role: "admin",
      };

      const cookieOptions = getSessionCookieOptions(ctx.req);
      const sessionToken = await sdk.signSession({
        openId: user.openId,
        appId: ENV.appId,
        name: user.name,
      }, { expiresInMs: ONE_YEAR_MS });

      (ctx.res as any).cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      return user;
    }),

  // Product routes
  getProducts: publicProcedure.query(() => db.getVisibleProducts()),
  getColumns: publicProcedure.query(() => db.getAllColumns()),

  // Reviews route
  createReview: publicProcedure
    .input(z.object({
      productId: z.number(),
      productName: z.string().optional(),
      userName: z.string().optional(),
      userEmail: z.string().optional(),
      rating: z.number().min(1).max(5),
      comment: z.string().min(1),
    }))
    .mutation(async ({ input }) => await db.createReview(input)),

  // Manual Payment & Discord Webhook
  submitManualPayment: publicProcedure
    .input(z.object({
      orderId: z.string(),
      method: z.enum(['paypal', 'ltc', 'paysafecard']),
      buyerName: z.string(),
      buyerEmail: z.string().email(),
      items: z.array(z.object({
        name: z.string(),
        quantity: z.number(),
        price: z.string()
      })),
      total: z.string(),
      paymentProof: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1467183990380171304/cp8H9z5JqNG73ljKB9Jc1mbYGGwsa4u6lleOWSUcosESJeIqKyRO5y1riQcSQ-d79r2e";
        
        // URL de base pour les actions
        const headers = (ctx.req as any)?.headers || {};
        const host = headers.host || 'localhost:3000';
        const protocol = headers['x-forwarded-proto'] || 'http';
        const baseUrl = `${protocol}://${host}`;
        
        // Construire le message Discord
        const embed = {
          title: `🛒 Nouvelle Commande : ${input.orderId}`,
          description: `Une nouvelle commande attend votre validation.`,
          color: 0x3b82f6,
          fields: [
            { name: "👤 Client (Email)", value: input.buyerEmail, inline: true },
            { name: "💳 Méthode", value: input.method.toUpperCase(), inline: true },
            { name: "💰 Total", value: input.total, inline: true },
            { name: "📝 Preuve / Code PIN / TXID", value: `\`\`\`${input.paymentProof || "N/A"}\`\`\`` },
            { name: "📦 Produits & IDs Panier", value: input.items.map((i: any) => `• **${i.name}** (ID: ${i.id}) x${i.quantity}`).join('\n') }
          ],
          footer: { text: "Axa Shop - Système de Paiement Manuel" },
          timestamp: new Date().toISOString()
        };

        const acceptUrl = `${baseUrl}/api/order/validate?action=accept&orderId=${input.orderId}&email=${encodeURIComponent(input.buyerEmail)}&name=${encodeURIComponent(input.buyerName)}`;
        const rejectUrl = `${baseUrl}/api/order/validate?action=reject&orderId=${input.orderId}&email=${encodeURIComponent(input.buyerEmail)}`;

        const message = {
          content: `🔔 **Nouvelle commande reçue !**\n\n✅ [ACCEPTER](${acceptUrl})\n❌ [REFUSER](${rejectUrl})`,
          embeds: [embed]
        };

        // Sauvegarder la commande en base
        await db.createOrder(input);

        // Envoyer à Discord
        try {
          await axios.post(DISCORD_WEBHOOK_URL, message);
        } catch (discordError: any) {
          console.error("Erreur lors de l'envoi à Discord:", discordError.response?.data || discordError.message);
          // Ne pas bloquer la réponse si Discord échoue
        }

        return { success: true, orderId: input.orderId };
      } catch (error) {
        console.error("Erreur dans submitManualPayment:", error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors du traitement de la commande',
          cause: error,
        });
      }
    }),

  paysafecard: paysafecardRouter,
  getLtcHistory: publicProcedure.query(async () => {
    const LTC_ADDRESS = process.env.LITECOIN_ADDRESS || 'LdM8wifnAMZwtMAjsq8caxrtXjYRfrf2nV';
    try {
      const url = `https://api.blockcypher.com/v1/ltc/main/addrs/${LTC_ADDRESS}/full?limit=10`;
      const response = await axios.get(url);
      return response.data.txs || [];
    } catch (error) {
      console.error("[LTC History] Erreur:", error);
      return [];
    }
  }),

  // Admin routes
  adminGetColumns: adminProcedure.query(() => db.getAllColumns()),
  adminGetProducts: adminProcedure.query(() => db.getVisibleProducts()),
  adminGetReviews: adminProcedure.query(() => db.getAllReviews()),
  adminDeleteReview: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => await db.deleteReview(input.id)),

  // PayPal Capture route
  capturePaypalOrder: publicProcedure
    .input(z.object({
      orderId: z.string(), // PayPal Order ID
      shopOrderId: z.string(), // Notre ID de commande interne
    }))
    .mutation(async ({ input }) => {
      try {
        const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
        const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

        if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Clés PayPal non configurées sur le serveur.',
          });
        }

        // 1. Obtenir un token d'accès PayPal (API Live)
        const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
        const tokenRes = await axios.post('https://api-m.paypal.com/v1/oauth2/token', 'grant_type=client_credentials', {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });
        const accessToken = tokenRes.data.access_token;

        // 2. Capturer le paiement
        const captureRes = await axios.post(`https://api-m.paypal.com/v2/checkout/orders/${input.orderId}/capture`, {}, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (captureRes.data.status === 'COMPLETED') {
          // 3. Valider la commande dans notre base
          await db.updateOrderStatus(input.shopOrderId, 'completed', {
            text: `Paiement PayPal capturé automatiquement. PayPal ID: ${input.orderId}`
          });

          // 4. Notifier Discord
          const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
          if (DISCORD_WEBHOOK_URL) {
            await axios.post(DISCORD_WEBHOOK_URL, {
              embeds: [{
                title: '✅ Paiement PayPal Validé Automatiquement',
                description: `La commande **${input.shopOrderId}** a été capturée et validée.`,
                color: 0x0070ba,
                fields: [
                  { name: 'PayPal Order ID', value: input.orderId, inline: true },
                  { name: 'Shop Order ID', value: input.shopOrderId, inline: true },
                ],
                timestamp: new Date().toISOString()
              }]
            }).catch(() => {}); // Ne pas bloquer si Discord fail
          }

          return { success: true };
        }
        return { success: false, status: captureRes.data.status };
      } catch (error: any) {
        console.error('PayPal Capture Error:', error.response?.data || error.message);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la capture du paiement PayPal : ' + (error.response?.data?.message || error.message),
        });
      }
    }),

  // Admin Order routes
  adminGetOrders: adminProcedure.query(() => db.getAllOrders()),
  adminUpdateOrder: adminProcedure
    .input(z.object({
      orderId: z.string(),
      status: z.string(),
      deliveryData: z.object({
        text: z.string().optional(),
        fileUrl: z.string().optional(),
      }).optional(),
    }))
    .mutation(async ({ input }) => {
      const order = await db.updateOrderStatus(input.orderId, input.status, input.deliveryData);
      
      // Si la commande est acceptée, on pourrait envoyer un mail ici
      if (input.status === 'completed' && order) {
        try {
          const { transporter } = await import("./routers/paysafecard");
          await (transporter as any).sendMail({
            from: process.env.PAYPAL_EMAIL || "gerarbarbier17@gmail.com",
            to: order.buyerEmail,
            subject: `[Axa Shop] Votre commande ${order.id} est prête !`,
            html: `
              <h2>Votre commande est validée !</h2>
              <p>Merci pour votre achat sur Axa Shop.</p>
              ${input.deliveryData?.text ? `<div style="padding: 15px; background: #f3f4f6; border-radius: 8px; margin: 10px 0;"><strong>Message de l'admin :</strong><br/>${input.deliveryData.text}</div>` : ""}
              ${input.deliveryData?.fileUrl ? `<p>Vous pouvez télécharger votre produit ici : <a href="${input.deliveryData.fileUrl}">${input.deliveryData.fileUrl}</a></p>` : ""}
              <p>ID Commande : ${order.id}</p>
            `,
          });
        } catch (e) {
          console.error("Erreur envoi mail livraison:", e);
        }
      }
      
      return order;
    }),
});

export type AppRouter = typeof appRouter;
