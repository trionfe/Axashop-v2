import { router, publicProcedure, adminProcedure } from "../_core/trpc";
import { z } from "zod";

// Paysafecard router - drizzle removed, uses simple in-memory stub
export const paysafecardRouter = router({
  submitCode: publicProcedure
    .input(z.object({
      code: z.string(),
      amount: z.number(),
      buyerEmail: z.string().email(),
      orderId: z.string(),
    }))
    .mutation(async ({ input }) => {
      return { success: true, message: "Code reçu.", orderId: input.orderId };
    }),

  getPendingCodes: adminProcedure.query(async () => {
    return [];
  }),

  validateCode: adminProcedure
    .input(z.object({ codeId: z.string(), isValid: z.boolean(), notes: z.string().optional() }))
    .mutation(async ({ input }) => {
      return { success: true, message: `Code ${input.isValid ? "approuvé" : "rejeté"}` };
    }),

  checkCodeStatus: publicProcedure
    .input(z.object({ orderId: z.string() }))
    .query(async ({ input }) => {
      return { status: "not_found" };
    }),
});
