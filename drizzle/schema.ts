import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extended with additional tables for e-commerce functionality.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Colonnes (Categories) - Dynamically managed by admin
 * Represents product categories like Discord, Spotify, Roblox, etc.
 */
export const columns = mysqlTable("columns", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  icon: varchar("icon", { length: 255 }), // Icon name or URL
  displayOrder: int("displayOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Column = typeof columns.$inferSelect;
export type InsertColumn = typeof columns.$inferInsert;

/**
 * Produits - Digital products/vouchers
 */
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  columnId: int("columnId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  image: varchar("image", { length: 512 }), // S3 URL
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  stock: int("stock").default(0).notNull(),
  isVisible: boolean("isVisible").default(true).notNull(),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * Commandes - Orders/Transactions
 */
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productId: int("productId").notNull(),

  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "completed", "failed", "refunded"]).default("pending").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 64 }),
  metadata: json("metadata"), // Additional order data
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

/**
 * Statistiques - Aggregated stats for dashboard
 */
export const statistics = mysqlTable("statistics", {
  id: int("id").autoincrement().primaryKey(),
  date: timestamp("date").defaultNow().notNull(),
  totalSales: decimal("totalSales", { precision: 15, scale: 2 }).default("0").notNull(),
  totalOrders: int("totalOrders").default(0).notNull(),
  activeMembers: int("activeMembers").default(0).notNull(),
  totalVouchers: int("totalVouchers").default(0).notNull(),
  securityRate: decimal("securityRate", { precision: 5, scale: 2 }).default("100").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Statistic = typeof statistics.$inferSelect;
export type InsertStatistic = typeof statistics.$inferInsert;

/**
 * Notifications - Email notifications log
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["new_order", "new_user", "payment_failed", "system_alert"]).notNull(),
  recipientEmail: varchar("recipientEmail", { length: 320 }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  content: text("content"),
  isSent: boolean("isSent").default(false).notNull(),
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Paysafecard Codes - Manual validation system for Paysafecard payments
 */
export const paysafecardCodesTable = mysqlTable("paysafecard_codes", {
  id: varchar("id", { length: 36 }).primaryKey(),
  code: varchar("code", { length: 16 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  buyerEmail: varchar("buyerEmail", { length: 320 }).notNull(),
  orderId: varchar("orderId", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  notes: text("notes"),
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
  validatedAt: timestamp("validatedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PaysafecardCode = typeof paysafecardCodesTable.$inferSelect;
export type InsertPaysafecardCode = typeof paysafecardCodesTable.$inferInsert;

/**
 * Reviews - Customer reviews/vouchers for products
 */
export const reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  productName: varchar("productName", { length: 255 }).notNull(),
  userName: varchar("userName", { length: 255 }).notNull(),
  userEmail: varchar("userEmail", { length: 320 }).notNull(),
  rating: int("rating").notNull(), // 1-5 stars
  comment: text("comment").notNull(),
  isApproved: boolean("isApproved").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;
