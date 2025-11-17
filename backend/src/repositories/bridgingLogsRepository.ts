import { eq } from "drizzle-orm";
import { IBridgingLogsRepository } from "../abstractions/ibridgingLogsRepository";
import { BridgingLog, bridgingLogs, insertBridgingLogSchema, NewBridgingLog, selectBridgingLogSchema } from "../schema/bridgingLogs.schema";
import { MySql2Database } from "drizzle-orm/mysql2";

export class BridgingLogsRepository implements IBridgingLogsRepository {
  constructor(private readonly db: MySql2Database) {}

  async insert(bridgingLog: NewBridgingLog): Promise<void> {
    const validatedBridgingLog = insertBridgingLogSchema.parse(bridgingLog);
    await this.db.insert(bridgingLogs).values(validatedBridgingLog);
  }
  async getBySourceUserAddress(sourceUserAddress: string): Promise<BridgingLog[]> {
    const rows = await this.db.select().from(bridgingLogs).where(eq(bridgingLogs.sourceUserAddress, sourceUserAddress));
    return rows.map((row) => selectBridgingLogSchema.parse(row));
  }
  async getByDestinationUserAddress(destinationUserAddress: string): Promise<BridgingLog[]> {
    const rows = await this.db.select().from(bridgingLogs).where(eq(bridgingLogs.destinationUserAddress, destinationUserAddress));
    return rows.map((row) => selectBridgingLogSchema.parse(row));
  }
}
