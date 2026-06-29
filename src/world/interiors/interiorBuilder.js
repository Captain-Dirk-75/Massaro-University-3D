import { buildLibraryInterior } from './builders/libraryInterior.js';

const BUILDERS = {
  library: buildLibraryInterior,
};

export function buildInterior(definition) {
  const builder = BUILDERS[definition.build];
  if (!builder) {
    throw new Error(`Unknown interior builder: ${definition.build}`);
  }
  return builder(definition);
}