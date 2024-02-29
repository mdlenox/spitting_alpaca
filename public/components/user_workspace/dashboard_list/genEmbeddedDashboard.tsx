import { CoreStart, SimpleSavedObject } from 'src/core/public';
import React, { Component } from 'react';
import { DashboardContainerFactory } from 'src/plugins/dashboard/public/dashboard_container/index';
import { DashboardPanelState } from 'src/plugins/dashboard/common/index';

import { DashboardContainerInput } from 'src/plugins/dashboard/common/index';
import { SavedDashboardPanel } from 'src/plugins/dashboard/common/content_management/index';
import { AppPluginStartDependencies } from '../../../types';
import { convertSavedDashboardPanelToPanelState } from '../converters/saved_objects_converters';
import {
  SavedObjectEmbeddableInput,
  ViewMode,
} from '../../../../../../src/plugins/embeddable/public';
import { createDashboardContainerByValueRenderer } from './createdasboardcontainer';
import ReactDOM from 'react-dom';
import { FavoritedDash } from '../../../../common/types';
import { TimeRange, Filter, Query } from '@kbn/es-query';

interface DashboardMeta {
  filter: Filter[];
  query: Query;
}

export interface SavedDashboard extends SimpleSavedObject {
  attributes: {
    kibanaSavedObjectMeta: { searchSourceJSON: string };
    panelsJSON: string;
    title: string;
  };
}

export interface RawPanel extends SavedDashboardPanel {
  panelRefName: string;
  id: string;
  type: string;
  title: string;
  embeddableConfig: any;
}

interface DashProps {
  core: CoreStart;
  plugins: AppPluginStartDependencies;
  fav: FavoritedDash;
  parentid: string;
}

interface DashState {
  savedDashboard?: SavedDashboard;
  dashmeta?: DashboardMeta;
  dashboardFactory: DashboardContainerFactory;
  embeddablesMap?: { [key: string]: DashboardPanelState<SavedObjectEmbeddableInput> };
}

export class GenEmbeddedDashboard extends Component<DashProps, DashState> {
  constructor(props: DashProps) {
    super(props);

    var savedDashboard: SavedDashboard;

    var dashboardFactory = props.plugins.embeddable.getEmbeddableFactory(
      'dashboard'
    ) as DashboardContainerFactory;
    this.state = {
      dashboardFactory: dashboardFactory,
    };
    props.core.savedObjects.client
      .get('dashboard', props.fav.dashid)
      .then(async (res) => {
        const embeddablesMap: {
          [key: string]: DashboardPanelState;
        } = {};
        savedDashboard = res as SavedDashboard;
        var dashmeta: DashboardMeta = JSON.parse(
          savedDashboard.attributes.kibanaSavedObjectMeta.searchSourceJSON
        );
        var rawpanels = JSON.parse(savedDashboard.attributes.panelsJSON);
        //props.plugins.embeddable.EmbeddablePanel
        var ndx: number;
        var idx: number = 0;
        for (ndx = 0; ndx < savedDashboard.references.length; ndx++) {
          for (idx = 0; idx < rawpanels.length; idx++) {
            if (savedDashboard.references[ndx].name == rawpanels[idx].panelRefName) {
              rawpanels[idx].id = savedDashboard.references[ndx].id as string;
              rawpanels[idx].type = savedDashboard.references[ndx].type as string;
              await props.core.savedObjects.client
                .get(rawpanels[idx].type, rawpanels[idx].id)
                .then((res) => {
                  var temp = convertSavedDashboardPanelToPanelState(rawpanels[idx]);
                  // console.log(plugins.embeddable.getEmbeddablePanel(temp))
                  embeddablesMap[rawpanels[idx].panelIndex] = temp;
                });
            }
          }
        }
        this.setState({
          savedDashboard: savedDashboard,
          dashmeta: dashmeta,
          embeddablesMap: embeddablesMap,
        });
      })
      .catch((err) => {
        console.log(err);
      });
    console.log();
  }

  render() {
    var id = 'emebeddeddash-' + this.props.fav.dashid;
    var element = <div id={id}></div>;

    const asyncRender = async () => {
      var containerProps: DashboardContainerInput = {
        isEmbeddedExternally: false,
        id: this.props.fav.dashid,
        viewMode: ViewMode.VIEW,
        filters: this.props.fav.showfilter
          ? (this.props.fav?.filters as Filter[])
          : this.state.dashmeta!.filter,
        panels: this.state.embeddablesMap!,
        query: this.props.fav.showquery
          ? (this.props.fav.query as Query)
          : this.state.dashmeta!.query,
        timeRange: this.props.fav.showtime
          ? (this.props.fav.time as TimeRange)
          : this.props.plugins.data.query.timefilter.timefilter.getTime(),
        useMargins: true,
        title: this.state.savedDashboard!.attributes.title,

        timeRestore: false,
        tags: [],
        hidePanelTitles: false,
        syncTooltips: false,
        syncColors: false,
        syncCursor: false,
      };
      var ContainerRenderer = createDashboardContainerByValueRenderer({
        factory: this.state.dashboardFactory,
      });
      ReactDOM.render(
        <ContainerRenderer input={containerProps} />,
        document.getElementById(this.props.parentid)
      );
    };

    if (this.state.embeddablesMap) {
      asyncRender();
    }

    return element;
  }
}
