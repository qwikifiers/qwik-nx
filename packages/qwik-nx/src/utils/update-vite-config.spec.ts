import { updateViteConfig } from './update-vite-config';

describe('updateViteConfig', () => {
  it('update existing qwik vite plugin config prop', () => {
    const sourceText = `
    export default defineConfig(() => {
      return {
        plugins: [
          qwikVite({ssr:false}),
        ],
      };
    });
  `;
    const outputText = updateViteConfig(sourceText, {
      qwikViteConfig: {
        ssr: `{ outDir: 'netlify/edge-functions/entry.netlify' }`,
      },
    })!;
    expect(outputText).toContain(
      'qwikVite({ ssr: { outDir: "netlify/edge-functions/entry.netlify" } })'
    );
  });

  it('update qwik vite plugin config', () => {
    const sourceText = `
    export default defineConfig(() => {
      return {
        plugins: [
          qwikVite({abc:88}),
        ],
      };
    });
  `;
    const outputText = updateViteConfig(sourceText, {
      qwikViteConfig: {
        ssr: `{ outDir: 'netlify/edge-functions/entry.netlify' }`,
      },
    })!;
    expect(outputText).toContain(
      'qwikVite({ ssr: { outDir: "netlify/edge-functions/entry.netlify" }, abc: 88 })'
    );
  });

  it('add qwik vite plugin config', () => {
    const sourceText = `
    export default defineConfig(() => {
      return {
        plugins: [
          qwikVite(),
        ],
      };
    });
  `;
    const outputText = updateViteConfig(sourceText, {
      qwikViteConfig: {
        ssr: `{ outDir: 'netlify/edge-functions/entry.netlify' }`,
      },
    })!;
    expect(outputText).toContain(
      'qwikVite({ ssr: { outDir: "netlify/edge-functions/entry.netlify" } })'
    );
  });

  it('add qwik vite plugin config for object based vite config', () => {
    const sourceText = `
      export default defineConfig({
        plugins: [
          qwikVite(),
        ],
      });
    `;
    const outputText = updateViteConfig(sourceText, {
      qwikViteConfig: {
        ssr: `{ outDir: 'netlify/edge-functions/entry.netlify' }`,
      },
    })!;
    expect(outputText).toContain(
      'qwikVite({ ssr: { outDir: "netlify/edge-functions/entry.netlify" } })'
    );
  });

  it('add vite plugin', () => {
    const sourceText = `
    export default defineConfig(() => {
      return {
        plugins: [
          qwikVite(),
        ],
      };
    });
  `;
    const outputText = updateViteConfig(sourceText, {
      vitePlugins: [`netlifyEdge({ functionName: 'entry.netlify' })`],
    })!;
    expect(outputText).toContain(
      'netlifyEdge({ functionName: "entry.netlify" })'
    );
  });

  it('add vite plugin to object based config', () => {
    const sourceText = `
    export default defineConfig({
      plugins: [
        qwikVite(),
      ],
    });
  `;
    const outputText = updateViteConfig(sourceText, {
      vitePlugins: [`netlifyEdge({ functionName: 'entry.netlify' })`],
    })!;
    expect(outputText).toContain(
      'netlifyEdge({ functionName: "entry.netlify" })'
    );
  });

  it('should not add vite plugin if it already exists', () => {
    const sourceText = `
    export default defineConfig(() => {
      return {
        plugins: [
          qwikVite(),
          netlifyEdge()
        ],
      };
    });
  `;
    const outputText = updateViteConfig(sourceText, {
      vitePlugins: [`netlifyEdge({ functionName: 'entry.netlify' })`],
    })!;
    const prepareOutput = (str: string) =>
      str
        .split('\n')
        .map((part) => part.trim())
        .join('\n');
    expect(prepareOutput(outputText)).toEqual(
      prepareOutput(`export default defineConfig(() => {
      return {
        plugins: [
          qwikVite(),
          netlifyEdge()
        ]
      };
    });
  `)
    );
  });

  it('update vite config', () => {
    const sourceText = `
    export default defineConfig(() => {
      return {
        ssr: {},
        plugins: [
          qwikVite(),
        ],
      };
    });
  `;
    const outputText = updateViteConfig(sourceText, {
      viteConfig: { ssr: `{ target: 'webworker', noExternal: true }` },
    })!;
    expect(outputText).toContain(
      'ssr: { target: "webworker", noExternal: true'
    );
  });

  it('update object based vite config', () => {
    const sourceText = `
    export default defineConfig({
      ssr: {},
      plugins: [
        qwikVite(),
      ],
    });
  `;
    const outputText = updateViteConfig(sourceText, {
      viteConfig: { ssr: `{ target: 'webworker', noExternal: true }` },
    })!;
    expect(outputText).toContain(
      'ssr: { target: "webworker", noExternal: true'
    );
  });

  it('add vite config', () => {
    const sourceText = `
    export default defineConfig(() => {
      return {
        plugins: [
          qwikVite(),
        ],
      };
    });
  `;
    const outputText = updateViteConfig(sourceText, {
      viteConfig: { ssr: `{ target: 'webworker', noExternal: true }` },
    })!;
    expect(outputText).toContain(
      'ssr: { target: "webworker", noExternal: true'
    );
  });

  it('add imports to side effect default import', () => {
    const sourceText = `import a from "@builder.io/qwik";`;
    const outputText = updateViteConfig(sourceText, {
      imports: [
        { namedImports: ['b'], importPath: '@builder.io/qwik' },
        { namedImports: ['c', 'd'], importPath: '@builder.io/sdk-react' },
      ],
    })!;
    expect(outputText).toContain('import a, { b } from "@builder.io/qwik";');
    expect(outputText).toContain(
      'import { c, d } from "@builder.io/sdk-react";'
    );
  });

  it('do not re-add named imports', () => {
    const sourceText = `
    import { a } from "@builder.io/qwik";
    import { b, c } from "@builder.io/sdk-react";
    `;
    const outputText = updateViteConfig(sourceText, {
      imports: [
        { namedImports: ['a'], importPath: '@builder.io/qwik' },
        { namedImports: ['b', 'c'], importPath: '@builder.io/sdk-react' },
      ],
    })!;
    expect(outputText).toContain('import { a } from "@builder.io/qwik";');
    expect(outputText).toContain(
      'import { b, c } from "@builder.io/sdk-react";'
    );
  });

  it('add imports to side effect import', () => {
    const sourceText = `import "@builder.io/qwik";\nconsole.log(88);`;
    const outputText = updateViteConfig(sourceText, {
      imports: [{ namedImports: ['a'], importPath: '@builder.io/qwik' }],
    })!;
    expect(outputText).toContain('import { a } from "@builder.io/qwik"');
  });

  it('leave existing imports', () => {
    const sourceText = `import { a } from "@builder.io/qwik";`;
    const outputText = updateViteConfig(sourceText, {
      imports: [{ namedImports: ['b'], importPath: '@builder.io/qwik' }],
    })!;
    expect(outputText).toContain('import { a, b } from "@builder.io/qwik";');
  });

  it('renamed default import with existing named import', () => {
    const sourceText = `import a, { b } from '@builder.io/sdk-react'`;
    const outputText = updateViteConfig(sourceText, {
      imports: [
        { defaultImport: 'c', importPath: '@builder.io/sdk-react' },
        { namedImports: ['d'], importPath: '@builder.io/qwik' },
      ],
    })!;
    expect(outputText).toContain(
      'import c, { b } from "@builder.io/sdk-react";'
    );
    expect(outputText).toContain('import { d } from "@builder.io/qwik";');
  });

  it('renamed default import', () => {
    const sourceText = `import a from '@builder.io/sdk-react'`;
    const outputText = updateViteConfig(sourceText, {
      imports: [{ defaultImport: 'b', importPath: '@builder.io/sdk-react' }],
    })!;
    expect(outputText).toContain('import b from "@builder.io/sdk-react";');
  });

  it('add default import to empty file', () => {
    const sourceText = ``;
    const outputText = updateViteConfig(sourceText, {
      imports: [{ defaultImport: 'a', importPath: '@builder.io/sdk-react' }],
    })!;
    expect(outputText).toContain('import a from "@builder.io/sdk-react";');
  });

  it('add named imports to empty file', () => {
    const sourceText = ``;
    const outputText = updateViteConfig(sourceText, {
      imports: [{ namedImports: ['a'], importPath: '@builder.io/sdk-react' }],
    })!;
    expect(outputText).toContain('import { a } from "@builder.io/sdk-react";');
  });
});
