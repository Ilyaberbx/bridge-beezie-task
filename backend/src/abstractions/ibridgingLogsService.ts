import { BridgingLog, NewBridgingLog } from "../schema/bridgingLogs.schema";

export interface IBridgingLogsService {
  insert(bridgingLog: NewBridgingLog): Promise<void>;
  getBySourceUserAddress(sourceUserAddress: string): Promise<BridgingLog[]>;
  getByDestinationUserAddress(destinationUserAddress: string): Promise<BridgingLog[]>;
}
