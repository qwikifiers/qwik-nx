import { Tree } from "@nrwl/devkit";

const viteBaseContent = `
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {};
});
`

export function addViteBase(tree: Tree): void {
   if (!tree.exists('vite.base.ts')) {
    tree.write('vite.base.ts', viteBaseContent)
   }
}