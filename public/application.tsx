import React from 'react';
import ReactDOM from 'react-dom';

import { AppMountParameters, CoreStart } from '../../../src/core/public';
import { AppPluginStartDependencies } from './types';
import { SpittingAlpacaApp } from './components/user_workspace/app';
import { HashRouter } from 'react-router-dom';

export const renderApp = (
  core: CoreStart,
  plugins: AppPluginStartDependencies,
  { appBasePath, element }: AppMountParameters
) => {
  ReactDOM.render(
    <HashRouter>
      <SpittingAlpacaApp
        basename={appBasePath}
        notifications={core.notifications}
        http={core.http}
        navigation={plugins.navigation}
        core={core}
        plugins={plugins}
      />
    </HashRouter>,
    element
  );
  return () => ReactDOM.unmountComponentAtNode(element);
};
