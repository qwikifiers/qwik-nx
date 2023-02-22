import { VitePreviewServerExecutorOptions } from '@nrwl/vite/executors';

// VitePreviewServerExecutorOptions are expected to be passed into the executor,
// despite they're not explicitly specified in the schema.json
export type MicroFrontendsPreviewServerExecutorSchema =
  VitePreviewServerExecutorOptions & {
    skipRemotes?: string[];
    remoteConfigPath?: string;
  };
