export interface IOperationTrackerService {
  trackOperation<T>(operationKey: string, operation: () => Promise<T>): Promise<T>;
}
