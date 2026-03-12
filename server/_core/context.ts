import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
type User = { id: number; openId: string; name: string | null; email: string | null; role: string; loginMethod?: string | null; createdAt: Date; updatedAt: Date; lastSignedIn: Date; };
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
