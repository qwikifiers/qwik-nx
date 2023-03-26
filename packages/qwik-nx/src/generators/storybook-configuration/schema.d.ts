import { Linter } from '@nrwl/linter';

export interface StorybookConfigurationGeneratorSchema {
  name: string;
  linter?: Linter;
  js?: boolean;
  tsConfiguration?: boolean;
}
