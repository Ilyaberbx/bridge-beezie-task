import { desc, eq, and } from "drizzle-orm";
import { IBridgingLogsRepository } from "../abstractions/ibridgingLogsRepository";
import { BridgingLog, bridgingLogs, insertBridgingLogSchema, NewBridgingLog, selectBridgingLogSchema } from "../schema/bridgingLogs.schema";
import { MySql2Database } from "drizzle-orm/mysql2";

export class BridgingLogsRepository implements IBridgingLogsRepository {
  constructor(private readonly db: MySql2Database) {}

  async insert(bridgingLog: NewBridgingLog): Promise<void> {
    const validatedBridgingLog = insertBridgingLogSchema.parse(bridgingLog);
    await this.db.insert(bridgingLogs).values(validatedBridgingLog);
  }

  async getByUserAddresses(sourceUserAddress: string, destinationUserAddress: string, limit: number, offset: number): Promise<BridgingLog[]> {
    const rows = await this.db
      .select()
      .from(bridgingLogs)
      .where(and(eq(bridgingLogs.sourceUserAddress, sourceUserAddress), eq(bridgingLogs.destinationUserAddress, destinationUserAddress)))
      .orderBy(desc(bridgingLogs.timestamp))
      .limit(limit)
      .offset(offset);

    return rows.map((row) => selectBridgingLogSchema.parse(row));
  }
}
