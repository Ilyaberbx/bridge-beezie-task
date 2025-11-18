import { mysqlTable, varchar, decimal, timestamp, bigint } from "drizzle-orm/mysql-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const bridgingLogs = mysqlTable("bridging_logs", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  sourceTxHash: varchar("source_tx_hash", { length: 66 }).notNull(),
  sourceTxExplorerUrl: varchar("source_tx_explorer_url", { length: 255 }).notNull(),
  sourceUserAddress: varchar("source_user_address", { length: 42 }).notNull(),
  destinationTxHash: varchar("destination_tx_hash", { length: 66 }).notNull(),
  destinationTxExplorerUrl: varchar("destination_tx_explorer_url", { length: 255 }).notNull(),
  destinationUserAddress: varchar("destination_user_address", { length: 42 }).notNull(),
  amountBridged: decimal("amount_bridged", { precision: 20, scale: 6 }).notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export type NewBridgingLog = typeof bridgingLogs.$inferInsert;
export type BridgingLog = typeof bridgingLogs.$inferSelect;
export const insertBridgingLogSchema = createInsertSchema(bridgingLogs);
export const selectBridgingLogSchema = createSelectSchema(bridgingLogs);
