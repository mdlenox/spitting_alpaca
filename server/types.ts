import type { SecurityPluginSetup, SecurityPluginStart } from '@kbn/security-plugin/server';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SpittingAlpacaPluginSetup {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SpittingAlpacaPluginStart {}

export interface SpittingAlpacaStartupDependencies {
  security: SecurityPluginStart;
}
