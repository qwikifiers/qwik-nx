export interface BuildExecutorSchema {
  runSequence: string[];
  tsConfig?: string;
  skipTypeCheck?: boolean;
}
