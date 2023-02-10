import { StreamWriter } from '@builder.io/qwik';

export async function loadRemoteContent(
  stream: StreamWriter,
  url: string,
  init?: RequestInit
) {
  const decoder = new TextDecoder();

  let fragment: Response;
  try {
    fragment = await fetch(url, init);
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    throw new Error(`Failed to fetch remote's url: ${url}`, { cause: error });
  }

  const reader = fragment.body!.getReader();
  let fragmentChunk = await reader.read();
  let base = '';
  while (!fragmentChunk.done) {
    let rawHtml = decoder.decode(fragmentChunk.value);
    // if (import.meta.env.DEV) {
    //   // TODO: These regexes are a hack to work around the fact that the streamed content is failing to prefix base path.
    //   rawHtml = rawHtml.replace(
    //     /q:base="\/(\w+)\/build\/"/gm,
    //     (match, child) => {
    //       base = '/' + child;
    //       // console.log('FOUND', base);
    //       return match;
    //     }
    //   );
    //   rawHtml = rawHtml.replace(
    //     /="(\/src\/([^"]+))"/gm,
    //     (match, path) => {
    //       // console.log('REPLACE', path);
    //       return '="' + base + path + '"';
    //     }
    //   );
    //   rawHtml = rawHtml.replace(
    //     /"\\u0002(\/src\/([^"]+))"/gm,
    //     (match, path) => {
    //       // console.log('REPLACE', path);
    //       return '"\\u0002' + base + path + '"';
    //     }
    //   );
    // }
    stream.write(rawHtml);
    fragmentChunk = await reader.read();
  }
}
