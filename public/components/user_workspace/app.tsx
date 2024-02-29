import React, { Fragment, useMemo, useState } from 'react';
import { FormattedMessage, I18nProvider } from '@kbn/i18n-react';
import { BrowserRouter as Router } from 'react-router-dom';

import {
  EuiHorizontalRule,
  EuiTitle,
  EuiSpacer,
  EuiCollapsibleNavGroup,
  EuiPageTemplate,
  EuiPageHeader,
  EuiText,
  EuiTabs,
  EuiTab,
} from '@elastic/eui';

import { CoreStart, HttpStart } from '../../../../../src/core/public';
import { NavigationPublicPluginStart } from '../../../../../src/plugins/navigation/public';
import { PLUGIN_ID } from '../../../common';
import { AppPluginStartDependencies } from '../../types';
import logo from '../../assests/images/moondragon-large-no-background.svg';
import { GenDailyFeed } from './dailyfeed/genDailyFeed';
import DataTagManagementCenterTest from '../analyst_notes/data_tagging/data_tag_mangement_center/dataTagManagementCenter';
import FavoriteDashboardTable from './dailyfeed/favoriteDashboardTable';

interface SpittingAlpacaAppDeps {
  basename: string;
  notifications: CoreStart['notifications'];
  http: CoreStart['http'];
  navigation: NavigationPublicPluginStart;
  core: CoreStart;
  plugins: AppPluginStartDependencies;
}

export const SpittingAlpacaApp = ({
  basename,
  notifications,
  http,
  navigation,
  core,
  plugins,
}: SpittingAlpacaAppDeps) => {
  // Use React hooks to manage state.
  const DailyFeed = ({
    basename,
    http,
    plugins,
  }: {
    basename: string;
    http: HttpStart;
    plugins: AppPluginStartDependencies;
  }) => {
    var dash1 = '73608e50-4093-11eb-ab8f-3da4e5dacffc';
    var dash1wrpid = 'qvtL-' + dash1;
    // <DashboardViewport props={plugins.dashboard.DashboardContainerByValueRenderer} style={istyle}> </DashboardViewport>
    return (
      <div>
        <EuiCollapsibleNavGroup
          title={
            <EuiTitle>
              <div style={{ fontSize: '24' }}>
                <FormattedMessage
                  id="spittingAlpaca.congratulationsTitle"
                  defaultMessage="Daily Feed"
                />
              </div>
            </EuiTitle>
          }
          iconType="reporter"
          iconSize="xl"
          isCollapsible={true}
          initialIsOpen={true}
          background="none"
        >
          <EuiHorizontalRule margin="none" />
          <EuiSpacer size="l" />
          <div id={dash1wrpid}>
            <GenDailyFeed />
          </div>
        </EuiCollapsibleNavGroup>
      </div>
    );
  };

  const tabs = [
    {
      id: 'my-workspace--id',
      name: 'My Favorites',
      content: (
        <div>
          <EuiSpacer size="m" />
          <DailyFeed basename={basename} http={http} plugins={plugins} />
          <EuiSpacer size="m" />
          <EuiPageTemplate.Header>
            {
              <EuiTitle>
                <h2>
                  <FormattedMessage
                    id="spittingAlpaca.congratulationsTitle"
                    defaultMessage="My Favorites"
                  />
                </h2>
              </EuiTitle>
            }
          </EuiPageTemplate.Header>
          <FavoriteDashboardTable />
        </div>
      ),
    },
    {
      id: 'my-data-tags--id',
      name: 'Data Tags',
      content: (
        <Fragment>
          <EuiSpacer />
          <EuiText>
            <DataTagManagementCenterTest />
          </EuiText>
        </Fragment>
      ),
    },
  ];

  const [selectedTabId, setSelectedTabId] = useState('my-workspace--id');
  const selectedTabContent = useMemo(() => {
    return tabs.find((obj) => obj.id === selectedTabId)?.content;
  }, [selectedTabId]);

  const onSelectedTabChanged = (id: string) => {
    setSelectedTabId(id);
  };

  const renderTabs = () => {
    return tabs.map((tab, index) => (
      <EuiTab
        key={index}
        onClick={() => onSelectedTabChanged(tab.id)}
        isSelected={tab.id === selectedTabId}
      >
        {tab.name}
      </EuiTab>
    ));
  };

  // Render the application DOM.
  // Note that `navigation.ui.TopNavMenu` is a stateful component exported on the `navigation` plugin's start contract.
  return (
    <Router basename={basename}>
      <I18nProvider>
        <navigation.ui.TopNavMenu
          appName={PLUGIN_ID}
          showSearchBar={true}
          useDefaultBehaviors={true}
        />
        <EuiSpacer size="m"></EuiSpacer>
        <EuiPageHeader
          pageTitle="My Workspace"
          iconType={logo}
          iconProps={{ size: 'xxl' }}
        ></EuiPageHeader>
        <EuiTabs>{renderTabs()}</EuiTabs>
        {selectedTabContent}
      </I18nProvider>
    </Router>
  );
};

/*
[
            {
              label: 'Tab 1',
              isSelected: true,
            },
            {
              label: 'Tab 2',
            },
          ]


          <EuiPageTemplate.Header>
            <EuiTitle size="l">
              <h1>
                <EuiIcon type={logo} size="original" />
                <FormattedMessage
                  id="spittingAlpaca.helloWorldText"
                  defaultMessage=" My Workspace"
                />
                <div style={{ float: 'right' }}>
                  <EuiIconTip
                    type="iInCircle"
                    color="subdued"
                    content={<span>Spitting Alpaca Version v{config.version}</span>}
                  />
                </div>
              </h1>
            </EuiTitle>
          </EuiPageTemplate.Header>
*/
