import { BridgingLog, NewBridgingLog } from "../schema/bridgingLogs.schema";

export interface IBridgingLogsRepository {
  insert(bridgingLog: NewBridgingLog): Promise<void>;
  getByUserAddresses(sourceUserAddress: string, destinationUserAddress: string, limit: number, offset: number): Promise<BridgingLog[]>;
}
