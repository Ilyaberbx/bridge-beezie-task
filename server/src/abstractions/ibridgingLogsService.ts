import { BridgingLog, NewBridgingLog } from "../database/bridgingLogs.schema";

export interface IBridgingLogsService {
  insert(bridgingLog: NewBridgingLog): Promise<void>;
  getByUserAddresses(sourceUserAddress: string, destinationUserAddress: string, limit: number, offset: number): Promise<BridgingLog[]>;
}
