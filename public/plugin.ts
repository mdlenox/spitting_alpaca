import { i18n } from '@kbn/i18n';
import { App, AppMountParameters, CoreSetup, CoreStart, Plugin } from '../../../src/core/public';
import {
  SpittingAlpacaPluginSetup,
  SpittingAlpacaPluginStart,
  AppPluginStartDependencies,
  AppPluginSetupDependencies,
  FullSetup,
} from './types';
import { PLUGIN_NAME } from '../common';

//added dependencies
import logo from './assests/images/MDIcon-dragon.svg';

import {
  createStorage,
  setCore,
  setCoreSetup,
  setCurrentUser,
  setDataViews,
  setPlugins,
  setPluginsSetup,
  setStorage,
  setTimeHistory,
} from './services';

import { TimeHistory } from '../../../src/plugins/data/public';
import { GetFavoriteExtension } from './components/dashboard_addons/dashFavoriteExt';
import { DataViewsPublicPluginStart } from '@kbn/data-views-plugin/public';
import { GetIOCListExtension } from './components/IOC_List/IOCListExtension';
import { AuthenticatedUser } from '@kbn/security-plugin-types-common';

export interface DataStartDependencies {
  dataViews: DataViewsPublicPluginStart;
}

export class SpittingAlpacaPlugin
  implements Plugin<SpittingAlpacaPluginSetup, SpittingAlpacaPluginStart>
{
  public setup(core: CoreSetup, plugins: AppPluginSetupDependencies): SpittingAlpacaPluginSetup {
    const { navigation, discover, embeddable, uiActions, inspector, data, security } = plugins;
    setCoreSetup(core);
    setPluginsSetup(plugins);

    // //registering the Hierarchy View
    // discover.docViews.addDocView({
    //   title: 'Hierarchy View',
    //   component: DocHierarchyView,
    //   order: 11,
    // });

    //register the Data Tag doc view
    // discover.docViews.addDocView({
    //   title: 'Data Tags',
    //   component: DocViewAnalystTags,
    //   order: 11,
    // });

    var fullSetup: FullSetup = {
      core: core,
      plugins: {
        navigation: navigation,
        discover: discover,
        embeddable: embeddable,
        uiActions: uiActions,
        inspector: inspector,
        data: data,
        security: security,
      },
    };

    const { getCurrentUser } = security.authc;

    // not using `await` because the `setup` plugin lifecycle method should not be async.
    getCurrentUser().then((user: AuthenticatedUser) => {
      setCurrentUser(user);
    });

    // inspector.registerView(BulkAddInspectorView);
    navigation.registerMenuItem(GetFavoriteExtension(fullSetup));
    // navigation.registerMenuItem(GetNotesExtension(fullSetup));
    navigation.registerMenuItem(GetIOCListExtension(fullSetup));

    // Register an application into the side navigation menu
    // core.application.register({
    //   id: 'spittingAlpaca',
    //   title: PLUGIN_NAME,
    //   async mount(params: AppMountParameters) {
    //     // Load application bundle
    //     const { renderApp } = await import('./application');
    //     // Get start services as specified in kibana.json
    //     const [coreStart, depsStart] = await core.getStartServices();
    //     // Render the application
    //     return renderApp(coreStart, depsStart as AppPluginStartDependencies, params);
    //   },
    // });

    // Register an application into the side navigation menu
    const myWorkspaceApp: App = {
      id: 'SpitingAlpaca',
      title: 'My Workspace',
      appRoute: '/app/myworkspace',

      category: {
        id: '42',
        label: 'MoonDragon',
        order: 10,
        euiIconType: logo,
      },
      mount: async (params: AppMountParameters) => {
        // Load application bundle
        const { renderApp } = await import('./application');
        // Get start services as specified in kibana.json
        const [coreStart, depsStart] = await core.getStartServices();
        //this.currentHistory = params.history;
        var plugins = depsStart as AppPluginStartDependencies;
        // await getDataViews();
        // await genIndexPattensList(plugins.data.indexPatterns);
        // Render the application ,
        return renderApp(coreStart, depsStart as AppPluginStartDependencies, params);
      },
    };

    // const nutcrackerViewerApp: App = {
    //   id: 'nutcrackerViewer',
    //   title: 'Nutcracker Viewer',
    //   category: {
    //     id: '42',
    //     label: 'MoonDragon',
    //     order: 9,
    //     euiIconType: logo,
    //   },
    //   mount: async (params: AppMountParameters) => {
    //     // Load application bundle
    //     const { renderNutcrackerViewer } = await import(
    //       './components/nutcracker-viewer/nutcrackerapp'
    //     );
    //     // Get start services as specified in kibana.json
    //     const [coreStart, depsStart] = await core.getStartServices();
    //     // this.currentHistory = params.history;
    //     var plugins = depsStart as AppPluginStartDependencies;
    //     // await genIndexPattensList(plugins.data.indexPatterns);
    //     // Render the application
    //     return renderNutcrackerViewer(coreStart, depsStart as AppPluginStartDependencies, params);
    //   },
    // };

    // const controllerApp: App = {
    //   id: 'controller',
    //   title: 'Controller',
    //   category: {
    //     id: '42',
    //     label: 'MoonDragon',
    //     order: 12,
    //     euiIconType: logo,
    //   },
    //   mount: async (params: AppMountParameters) => {
    //     // Load application bundle
    //     const { renderController } = await import('./controllerapp');
    //     // Get start services as specified in kibana.json
    //     const [coreStart, depsStart] = await core.getStartServices();
    //     //this.currentHistory = params.history;
    //     var plugins = depsStart as AppPluginStartDependencies;
    //     await genIndexPattensList(plugins.data.indexPatterns);
    //     // Render the application
    //     return renderController(coreStart, depsStart as AppPluginStartDependencies, params);
    //   },
    // };

    core.application.register(myWorkspaceApp);
    // core.application.register(nutcrackerViewerApp);
    // core.application.register(controllerApp);

    // Return methods that should be available to other plugins
    return {
      getGreeting() {
        return i18n.translate('spittingAlpaca.greetingText', {
          defaultMessage: 'Hello from {name}!',
          values: {
            name: PLUGIN_NAME,
          },
        });
      },
    };
  }

  public start(core: CoreStart, plugins: AppPluginStartDependencies): SpittingAlpacaPluginStart {
    const storage = createStorage(window.localStorage);
    const timeHistory = new TimeHistory(storage);

    setStorage(storage);
    setTimeHistory(timeHistory);
    setCore(core);
    setPlugins(plugins);
    setDataViews(plugins.data.dataViews);
    return {};
  }

  public stop() {}
}
