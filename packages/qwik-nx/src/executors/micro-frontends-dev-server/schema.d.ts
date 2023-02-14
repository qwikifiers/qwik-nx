import { ViteDevServerExecutorOptions } from '@nrwl/vite/executors';

// ViteDevServerExecutorOptions are expected to be passed into the executor,
// despite they're not explicitly specified in the schema.json
export type MicroFrontendsDevServerExecutorSchema =
  ViteDevServerExecutorOptions & {
    skipRemotes?: string[];
    remoteConfigPath?: string;
  };
