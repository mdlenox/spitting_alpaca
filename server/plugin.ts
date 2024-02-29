import {
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  Plugin,
  Logger,
} from '../../../src/core/server';
import { SpittingAlpacaPluginSetup, SpittingAlpacaPluginStart } from './types';
import { defineRoutes } from './routes';
import { SecurityPluginSetup } from '@kbn/security-plugin-types-public';

interface PluginSetupDeps {
  security: SecurityPluginSetup;
}

export class SpittingAlpacaPlugin
  implements Plugin<SpittingAlpacaPluginSetup, SpittingAlpacaPluginStart>
{
  private readonly logger: Logger;

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public setup(core: CoreSetup, { security }: PluginSetupDeps) {
    this.logger.debug('spitting_alpaca: Setup');
    const router = core.http.createRouter();
    // Register server side APIs

    defineRoutes(router, core, security);

    return {};
  }

  public start(core: CoreStart) {
    this.logger.debug('spitting_alpaca: Started');
    return {};
  }

  public stop() {}
}
