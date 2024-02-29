import './index.scss';

import { SpittingAlpacaPlugin } from './plugin';

// This exports static code and TypeScript types,
// as well as, Kibana Platform `plugin()` initializer.
export function plugin() {
  return new SpittingAlpacaPlugin();
}
export type { SpittingAlpacaPluginSetup, SpittingAlpacaPluginStart } from './types';
