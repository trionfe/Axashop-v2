import { router, publicProcedure, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { paysafecardCodesTable } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
// @ts-ignore
import nodemailer from "nodemailer";

// Configure email transporter (using Gmail SMTP for simplicity)
const transporter = (nodemailer as any).createTransport({
  service: "gmail",
  auth: {
    user: process.env.PAYSAFECARD_EMAIL || "gerarbarbier17@gmail.com",
    pass: process.env.GMAIL_APP_PASSWORD || "your-app-password", // Use app-specific password
  },
});

export const paysafecardRouter = router({
  // Submit a Paysafecard code for validation
  submitCode: publicProcedure
    .input(
      z.object({
        code: z.string().min(16).max(16), // Paysafecard codes are 16 digits
        amount: z.number().positive(),
        buyerEmail: z.string().email(),
        orderId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Store the code in the database with pending status
        const db = await getDb();
        const result = await (db as any).insert(paysafecardCodesTable).values({
          code: input.code,
          amount: input.amount,
          buyerEmail: input.buyerEmail,
          orderId: input.orderId,
          status: "pending",
          submittedAt: new Date(),
        });

        // Send email notification to admin
        await transporter.sendMail({
          from: process.env.PAYSAFECARD_EMAIL,
          to: process.env.PAYSAFECARD_EMAIL,
          subject: `[Axa Shop] Nouveau code Paysafecard reçu - ${input.amount}€`,
          html: `
            <h2>Nouveau code Paysafecard à valider</h2>
            <p><strong>Code:</strong> ${input.code}</p>
            <p><strong>Montant:</strong> €${input.amount.toFixed(2)}</p>
            <p><strong>Email acheteur:</strong> ${input.buyerEmail}</p>
            <p><strong>ID Commande:</strong> ${input.orderId}</p>
            <p><strong>Statut:</strong> En attente de validation</p>
            <p>Veuillez vérifier le code et le valider dans le panel admin.</p>
          `,
        });

        return {
          success: true,
          message: "Code reçu. Validation en cours...",
          orderId: input.orderId,
        };
      } catch (error) {
        console.error("Error submitting Paysafecard code:", error);
        throw new Error("Erreur lors de la soumission du code");
      }
    }),

  // Get all pending codes (admin only)
  getPendingCodes: adminProcedure.query(async () => {
    try {
      const db = await getDb();
      const codes = await (db as any)
        .select()
        .from(paysafecardCodesTable)
        .where(eq(paysafecardCodesTable.status, "pending"));

      return codes;
    } catch (error) {
      console.error("Error fetching pending codes:", error);
      throw new Error("Erreur lors de la récupération des codes");
    }
  }),

  // Validate a Paysafecard code (admin only)
  validateCode: adminProcedure
    .input(
      z.object({
        codeId: z.string(),
        isValid: z.boolean(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const status = input.isValid ? "approved" : "rejected";
        const db = await getDb();

        await (db as any)
          .update(paysafecardCodesTable)
          .set({
            status,
            validatedAt: new Date(),
            notes: input.notes,
          })
          .where(eq(paysafecardCodesTable.id, input.codeId));

        // Get the code details to send email
        const codeRecord = await (db as any)
          .select()
          .from(paysafecardCodesTable)
          .where(eq(paysafecardCodesTable.id, input.codeId));

        if (codeRecord.length > 0) {
          const code = codeRecord[0];

          // Send email to buyer
          await transporter.sendMail({
            from: process.env.PAYSAFECARD_EMAIL,
            to: code.buyerEmail,
            subject: `[Axa Shop] Paysafecard ${
              input.isValid ? "Approuvée" : "Rejetée"
            }`,
            html: `
              <h2>Statut de votre Paysafecard</h2>
              <p><strong>Statut:</strong> ${
                input.isValid ? "✅ Approuvée" : "❌ Rejetée"
              }</p>
              <p><strong>Montant:</strong> €${code.amount.toFixed(2)}</p>
              <p><strong>ID Commande:</strong> ${code.orderId}</p>
              ${input.notes ? `<p><strong>Notes:</strong> ${input.notes}</p>` : ""}
              <p>Merci d'avoir utilisé Axa Shop!</p>
            `,
          });
        }

        return {
          success: true,
          message: `Code ${input.isValid ? "approuvé" : "rejeté"}`,
        };
      } catch (error) {
        console.error("Error validating code:", error);
        throw new Error("Erreur lors de la validation du code");
      }
    }),

  // Check status of a code
  checkCodeStatus: publicProcedure
    .input(z.object({ orderId: z.string() }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        const codes = await (db as any)
          .select()
          .from(paysafecardCodesTable)
          .where(eq(paysafecardCodesTable.orderId, input.orderId));

        if (codes.length === 0) {
          return { status: "not_found" };
        }

        return {
          status: codes[0].status,
          amount: codes[0].amount,
          submittedAt: codes[0].submittedAt,
        };
      } catch (error) {
        console.error("Error checking code status:", error);
        throw new Error("Erreur lors de la vérification du statut");
      }
    }),
});
