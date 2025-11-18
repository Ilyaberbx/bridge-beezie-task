import { IOperationTrackerService } from "../abstractions/ioperationTrackerService";

export class OperationTrackerService implements IOperationTrackerService {
  private pendingOperations = new Map<string, Promise<any>>();

  async trackOperation<T>(operationKey: string, operation: () => Promise<T>): Promise<T> {
    const existingOperation = this.pendingOperations.get(operationKey);

    if (existingOperation) {
      console.log(`Duplicate operation detected for key: ${operationKey}. Returning existing operation result`);
      return await existingOperation;
    }

    const operationPromise = operation();
    this.pendingOperations.set(operationKey, operationPromise);

    try {
      const result = await operationPromise;
      return result;
    } finally {
      this.pendingOperations.delete(operationKey);
    }
  }
}
