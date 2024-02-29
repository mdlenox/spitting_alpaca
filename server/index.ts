import { PluginInitializerContext } from '../../../src/core/server';

//  This exports static code and TypeScript types,
//  as well as, Kibana Platform `plugin()` initializer.

export async function plugin(initializerContext: PluginInitializerContext) {
  const { SpittingAlpacaPlugin } = await import('./plugin');
  return new SpittingAlpacaPlugin(initializerContext);
}

export type { SpittingAlpacaPluginSetup, SpittingAlpacaPluginStart } from './types';
