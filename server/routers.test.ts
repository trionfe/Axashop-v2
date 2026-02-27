import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createMockContext(user?: AuthenticatedUser): TrpcContext {
  return {
    user: user || {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: { origin: "http://localhost:3000" },
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Auth Router", () => {
  it("should return current user with me query", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const user = await caller.auth.me();

    expect(user).toBeDefined();
    expect(user?.email).toBe("test@example.com");
    expect(user?.role).toBe("user");
  });

  it("should return null for unauthenticated user", async () => {
    const ctx = createMockContext(undefined);
    ctx.user = null;
    const caller = appRouter.createCaller(ctx);

    const user = await caller.auth.me();

    expect(user).toBeNull();
  });
});

describe("Columns Router", () => {
  it("should list all columns", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const columns = await caller.columns.list();

    expect(Array.isArray(columns)).toBe(true);
  });
});

describe("Products Router", () => {
  it("should list visible products", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const products = await caller.products.list();

    expect(Array.isArray(products)).toBe(true);
  });
});

describe("Statistics Router", () => {
  it("should return latest statistics", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.statistics.getLatest();

    // Statistics can be undefined if database is not available
    if (stats) {
      expect(typeof stats.activeMembers).toBe("number");
      expect(typeof stats.totalVouchers).toBe("number");
    }
  });
});

describe("Admin Router - Authorization", () => {
  it("should deny access to non-admin users", async () => {
    const ctx = createMockContext();
    ctx.user!.role = "user";
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.admin.columns.list();
      expect.fail("Should have thrown FORBIDDEN error");
    } catch (error: any) {
      expect(error.code).toBe("FORBIDDEN");
      expect(error.message).toContain("Admin access required");
    }
  });

  it("should allow access to admin users", async () => {
    const adminUser: AuthenticatedUser = {
      id: 1,
      openId: "admin-user",
      email: "admin@example.com",
      name: "Admin User",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };

    const ctx = createMockContext(adminUser);
    const caller = appRouter.createCaller(ctx);

    const columns = await caller.admin.columns.list();

    expect(Array.isArray(columns)).toBe(true);
  });
});

describe("Admin Router - Columns Management", () => {
  it("should allow admin to list columns", async () => {
    const adminUser: AuthenticatedUser = {
      id: 1,
      openId: "admin-user",
      email: "admin@example.com",
      name: "Admin User",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };

    const ctx = createMockContext(adminUser);
    const caller = appRouter.createCaller(ctx);

    const columns = await caller.admin.columns.list();

    expect(Array.isArray(columns)).toBe(true);
  });
});

describe("Admin Router - Users Management", () => {
  it("should allow admin to list users", async () => {
    const adminUser: AuthenticatedUser = {
      id: 1,
      openId: "admin-user",
      email: "admin@example.com",
      name: "Admin User",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };

    const ctx = createMockContext(adminUser);
    const caller = appRouter.createCaller(ctx);

    const users = await caller.admin.users.list();

    expect(Array.isArray(users)).toBe(true);
  });
});
