import { IBridgingLogsRepository } from "../abstractions/ibridgingLogsRepository";
import { IBridgingLogsService } from "../abstractions/ibridgingLogsService";
import { BridgingLog, NewBridgingLog } from "../schema/bridgingLogs.schema";

export class BridgingLogsService implements IBridgingLogsService {
  constructor(private readonly bridgingLogsRepository: IBridgingLogsRepository) {
    this.bridgingLogsRepository = bridgingLogsRepository;
  }

  async insert(bridgingLog: NewBridgingLog): Promise<void> {
    await this.bridgingLogsRepository.insert(bridgingLog);
  }

  async getBySourceUserAddress(sourceUserAddress: string): Promise<BridgingLog[]> {
    return await this.bridgingLogsRepository.getBySourceUserAddress(sourceUserAddress);
  }

  async getByDestinationUserAddress(destinationUserAddress: string): Promise<BridgingLog[]> {
    return await this.bridgingLogsRepository.getByDestinationUserAddress(destinationUserAddress);
  }
}
