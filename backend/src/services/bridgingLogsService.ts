import { IBridgingLogsRepository } from "../abstractions/ibridgingLogsRepository";
import { IBridgingLogsService } from "../abstractions/ibridgingLogsService";
import { BridgingLog, NewBridgingLog } from "../database/bridgingLogs.schema";

export class BridgingLogsService implements IBridgingLogsService {
  constructor(private readonly bridgingLogsRepository: IBridgingLogsRepository) {
    this.bridgingLogsRepository = bridgingLogsRepository;
  }

  async insert(bridgingLog: NewBridgingLog): Promise<void> {
    await this.bridgingLogsRepository.insert(bridgingLog);
  }

  async getByUserAddresses(sourceUserAddress: string, destinationUserAddress: string, limit: number, offset: number): Promise<BridgingLog[]> {
    return await this.bridgingLogsRepository.getByUserAddresses(sourceUserAddress, destinationUserAddress, limit, offset);
  }
}
