import { output } from '@nx/devkit';
import type { UserConfig } from 'vite';

/**
 * @deprecated this util is no longer used and will be removed in qwik-nx@4
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function withNx(config: UserConfig, ...unused: any[]): UserConfig {
  output.warn({
    title: '"withNx" storybook util has been deprecated',
    bodyLines: ['It will be removed in qwik-nx@4'],
  });
  return config;
}
