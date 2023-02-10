import {
  RenderToStreamOptions,
  RenderToStreamResult,
  renderToStream,
} from '@builder.io/qwik/server';
import { merge } from 'lodash-es';

export function renderToStreamHost(
  rootNode: any,
  opts: RenderToStreamOptions
): Promise<RenderToStreamResult> {
  const overrides: Partial<RenderToStreamOptions> = {
    prefetchStrategy: {
      implementation: {
        linkInsert: null,
        workerFetchInsert: null,
        prefetchEvent: 'always',
      },
    },
    qwikLoader: {
      include: 'always',
    },
    streaming: {
      inOrder: {
        strategy: 'auto',
        maximunInitialChunk: 0,
        maximunChunk: 0,
      },
    },
  };
  return renderToStream(rootNode, merge(overrides, opts));
}

export function renderToStreamRemote(
  rootNode: any,
  opts: RenderToStreamOptions
): Promise<RenderToStreamResult> {
  const overrides: Partial<RenderToStreamOptions> = {
    base: (opts) => {
      // removing query params from url and unifying to to the form "http://localhost:5001/build/"
      return new URL(opts.serverData!.url).origin + '/build/';
    },
    prefetchStrategy: {
      implementation: {
        linkInsert: null,
        workerFetchInsert: null,
        prefetchEvent: 'always',
      },
    },
    containerTagName: 'div',
    qwikLoader: {
      include: 'never',
    },
  };
  return renderToStream(rootNode, merge(overrides, opts));
}
