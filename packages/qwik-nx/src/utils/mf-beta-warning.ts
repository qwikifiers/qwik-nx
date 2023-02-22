import { output } from '@nrwl/devkit';

export function addMicroFrontendBetaWarning() {
  output.warn({
    title: '"qwik-nx" micro-frontends are in beta',
    bodyLines: [
      'There might be significant changes to the API without migrations provided.',
    ],
  });
}
