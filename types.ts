/**
 * Represents a task/quest in the application
 */
export interface Task {
  name: string;
  desc: string;
  flag: string;
}

/**
 * Helper methods for bitwise flag manipulation
 */
export interface FlagsHelper {
  set(flags: number, index: number, value: boolean): number;
  get(flags: number, index: number): boolean;
}

/**
 * The main app state interface
 */
export interface AppState {
  _flags: number;
  _tasks: Task[];
  _tasksLoaded: boolean;
  init(): Promise<void>;
  reset(): void;
  store(taskIndex: number): boolean;
}

/**
 * Custom event details
 */
export interface ShowQrScannerEventDetail {
  taskIndex: number;
}

export interface QuestCompletedEventDetail {
  taskIndex: number;
}
