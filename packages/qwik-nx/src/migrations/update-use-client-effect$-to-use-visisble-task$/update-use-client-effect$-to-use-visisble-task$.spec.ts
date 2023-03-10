import { addProjectConfiguration, Tree } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import migrate from './update-use-client-effect$-to-use-visisble-task$';

describe('Use new "qwik-nx:build" executor in qwik apps', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });
    addProjectConfiguration(tree, 'app1', {
      root: 'apps/app1',
    });
  });

  it('should update imports', async () => {
    const { other, toBeRenamedAfter, toBeRenamedBefore } = getTestFiles();
    const toBerenamedFilePath = 'apps/app1/to-be-renamed.tsx';
    const otherFilePath = 'apps/app1/other.tsx';
    tree.write(toBerenamedFilePath, toBeRenamedBefore);
    tree.write(otherFilePath, other);

    await migrate(tree);

    expect(tree.read(toBerenamedFilePath)?.toString()).toEqual(
      toBeRenamedAfter
    );
    expect(tree.read(otherFilePath)?.toString()).toEqual(other);
  });
});

function getTestFiles() {
  return {
    toBeRenamedBefore: `import { component$, useClientEffect$, useStore, useStylesScoped$ } from '@builder.io/qwik';
    import styles from './flower.css?inline';

    const anotherVar = useClientEffect$;
    
    export default component$(() => {
      useStylesScoped$(styles);
    
      const state = useStore({
        count: 0,
        number: 20,
      });
    
      useClientEffect$(({ cleanup }) => {
        const timeout = setTimeout(() => (state.count = 1), 500);
        cleanup(() => clearTimeout(timeout));
      });

      console.log('useClientEffect$');
    
      return (
        <>
         Content of a file that has useClientEffect$ function
        </>
      );
    });`,
    toBeRenamedAfter: `import { component$, useVisibleTask$, useStore, useStylesScoped$ } from '@builder.io/qwik';
    import styles from './flower.css?inline';

    const anotherVar = useVisibleTask$;
    
    export default component$(() => {
      useStylesScoped$(styles);
    
      const state = useStore({
        count: 0,
        number: 20,
      });
    
      useVisibleTask$(({ cleanup }) => {
        const timeout = setTimeout(() => (state.count = 1), 500);
        cleanup(() => clearTimeout(timeout));
      });

      console.log('useClientEffect$');
    
      return (
        <>
         Content of a file that has useClientEffect$ function
        </>
      );
    });`,
    other: `import { component$, useClientEffect$, useStore, useStylesScoped$ } from 'other-package';
    import styles from './flower.css?inline';
    
    export default component$(() => {
      useStylesScoped$(styles);
    
      const state = useStore({
        count: 0,
        number: 20,
      });
    
      useClientEffect$(({ cleanup }) => {
        const timeout = setTimeout(() => (state.count = 1), 500);
        cleanup(() => clearTimeout(timeout));
      });

      console.log('useClientEffect$');
    
      return (
        <>
         Content of a file that has useClientEffect$ function
        </>
      );
    });`,
  };
}
