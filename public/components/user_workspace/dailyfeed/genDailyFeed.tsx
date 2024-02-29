import { SimpleSavedObject } from 'src/core/public';
import React, { Component } from 'react';
import { DashboardContainer } from 'src/plugins/dashboard/public/dashboard_container/embeddable/dashboard_container';
import { DashboardContainerFactory } from 'src/plugins/dashboard/public/dashboard_container/index';
import { SavedDashboardPanel } from 'src/plugins/dashboard/common/content_management/index';
import { DashboardContainerInput } from 'src/plugins/dashboard/common/index';
import {
  EmbeddableFactoryNotFoundError,
  EmbeddableInput,
  EmbeddableRenderer,
  ErrorEmbeddable,
  isErrorEmbeddable,
  ViewMode,
} from '../../../../../../src/plugins/embeddable/public';
import { getCore, getGenDailyFeedObj, getPlugins, setGenDailyFeedObj } from '../../../services';
import { EuiButtonIcon, EuiFlexGroup, EuiLoadingChart } from '@elastic/eui';
import { dailyfeedtemplatestyle, DLIctrlstyle } from '../../../styles';
import { PanelConfig } from '../../../../common/types';
import { DashboardEmptyScreen } from './dashboard_empty_screen';

export interface SavedDashboard extends SimpleSavedObject {
  attributes: { panelsJSON: string };
}

export interface RawPanel extends SavedDashboardPanel {
  panelRefName: string;
  id: string;
  type: string;
  title: string;
  embeddableConfig: any;
}

interface GDFProps {}

interface GDFState {
  loading: boolean;
  FeedContainer?: DashboardContainer | ErrorEmbeddable;
  embeddablesMap?: PanelConfig;
  SavedEmbeddablesMap?: PanelConfig;
  Viewmode: ViewMode;
}

export class GenDailyFeed extends Component<GDFProps, GDFState> {
  private core = getCore();
  private plugins = getPlugins();
  private dashboardFactory = this.plugins.embeddable.getEmbeddableFactory(
    'dashboard'
  ) as DashboardContainerFactory;
  private defaultInput: DashboardContainerInput = {
    id: 'Daily_feed_input',
    viewMode: ViewMode.VIEW,
    filters: [],
    panels: {},
    query: { query: '', language: 'kuery' },
    timeRange: this.plugins.data.query.timefilter.timefilter.getTime(),
    useMargins: true,
    title: 'teststring',
    timeRestore: false,
    syncColors: true,
    tags: [],
    hidePanelTitles: false,
    syncTooltips: false,
    syncCursor: false,
  };

  constructor(props: GDFProps) {
    super(props);
    this.core.http.get('/api/spitting_alpaca/getdailyfeed').then(async (res: any) => {
      this.setState({
        embeddablesMap: res.dailycfg && res.dailycfg.panels ? res.dailycfg.panels : {},
        loading: false,
      });
    });

    setGenDailyFeedObj(this);
    this.dashboardFactory.create(this.defaultInput).then((FeedContainer: any) => {
      if (FeedContainer && !isErrorEmbeddable(FeedContainer)) {
        FeedContainer.getInput$().subscribe((newInput: any) => {
          this.onContainerUpdated(newInput);
        });
        this.plugins.data.query.timefilter.timefilter.getTimeUpdate$().subscribe(() => {
          FeedContainer.updateInput({
            timeRange: this.plugins.data.query.timefilter.timefilter.getTime(),
          });
        });
      }
      FeedContainer?.updateInput({ panels: this.state.embeddablesMap });
      this.setState({ FeedContainer: FeedContainer });
    });

    this.state = {
      loading: true,
      Viewmode: ViewMode.VIEW,
    };
  }

  CreatePanel = async () => {
    console.log('CreatePanel');
    const type = 'visualization';
    const factory = this.plugins.embeddable.getEmbeddableFactory(type);
    if (!factory) {
      throw new EmbeddableFactoryNotFoundError(type);
    }
    await factory.create({} as EmbeddableInput, this.state.FeedContainer as DashboardContainer);
  };

  AddPanel() {
    console.log('AddPanel');
    var GDFObj = getGenDailyFeedObj();
    if (GDFObj.state.Viewmode == ViewMode.VIEW) GDFObj.toggleEditMode();
    if (GDFObj.state.FeedContainer && !isErrorEmbeddable(GDFObj.state.FeedContainer)) {
      GDFObj.state.FeedContainer.addFromLibrary();
    }
  }

  toggleEditMode(saveChanges: boolean = false) {
    if (this.state.Viewmode == ViewMode.VIEW) {
      this.setState({
        Viewmode: ViewMode.EDIT,
        SavedEmbeddablesMap: this.state.embeddablesMap,
      });
      this.state.FeedContainer?.updateInput({ viewMode: ViewMode.EDIT });
    } else if (saveChanges) {
      // call updateDailyFeedcfg
      this.core.http
        .put('/api/spitting_alpaca/updatedailyfeed', {
          body: JSON.stringify({ panels: this.state.embeddablesMap }),
        })
        .then((res: any) => {
          if (res.status.statusCode == 200) {
            this.setState({
              Viewmode: ViewMode.VIEW,
            });
            this.state.FeedContainer?.updateInput({ viewMode: ViewMode.VIEW });
            this.core.notifications.toasts.addSuccess('Daily Feed Saved Sucessfully', {
              toastLifeTimeMs: 500,
            });
          } else {
            console.log(res);
            this.core.notifications.toasts.addDanger('Failed to Save Daily Feed', {
              toastLifeTimeMs: 500,
            });
          }
        })
        .catch((err) => {
          console.log(err);
          this.core.notifications.toasts.addDanger('Failed to Save Daily Feed', {
            toastLifeTimeMs: 500,
          });
        });
    } else {
      this.setState({
        Viewmode: ViewMode.VIEW,
        embeddablesMap: this.state.SavedEmbeddablesMap,
      });
      this.state.FeedContainer?.updateInput({
        viewMode: ViewMode.VIEW,
        panels: this.state.SavedEmbeddablesMap,
      });
    }
  }

  onContainerUpdated(newInput: DashboardContainerInput) {
    if (this.state.FeedContainer && !isErrorEmbeddable(this.state.FeedContainer)) {
      /*
      var {panels,isEmptyState} = newInput
        // set Empty State
        if (isEmptyState && Object.keys(panels).length!=0){
          this.state.FeedContainer.updateInput({isEmptyState:false})
        }else if(!isEmptyState && Object.keys(panels).length==0){
          this.state.FeedContainer.updateInput({isEmptyState:true})
        }
        //
        */
      if (newInput.panels != this.state.embeddablesMap) {
        this.setState({ embeddablesMap: newInput.panels });
      }
    }
  }

  componentDidUpdate(prevProps: GDFProps, prevState: GDFState) {
    if (this.state.FeedContainer && !isErrorEmbeddable(this.state.FeedContainer)) {
      if (prevState.loading && !this.state.loading) {
        this.state.FeedContainer.updateInput({
          panels: this.state.embeddablesMap,
          //isEmptyState: this.state.embeddablesMap == undefined|| Object.keys(this.state.embeddablesMap).length==0?true:false
        });
      }
    }
  }

  isDailyFeedEmpty(fc: DashboardContainer | ErrorEmbeddable | undefined) {
    if (Object.keys(this.state.embeddablesMap!).length == 0) {
      return true;
    } else {
      return false;
    }
  }

  renderDashboard(
    fc: DashboardContainer | ErrorEmbeddable | undefined,
    dcf: DashboardContainerFactory
  ) {
    if (this.isDailyFeedEmpty(fc)) {
      return (
        <EuiFlexGroup
          style={{
            margin: '2vh 1vw 0vh',
            border: '.1em solid #343741',
            borderRadius: '4px',
            minHeight: '28vh',
          }}
          alignItems="center"
          justifyContent="center"
          direction="column"
        >
          <DashboardEmptyScreen
            showLinkToVisualize={true}
            onLinkClick={this.AddPanel}
            onVisualizeClick={this.CreatePanel}
            uiSettings={this.core.uiSettings}
            http={this.core.http}
            isReadonlyMode={false}
          />
        </EuiFlexGroup>
      );
    } else {
      return <EmbeddableRenderer embeddable={this.state.FeedContainer!} />;
    }
  }

  render() {
    return this.state.loading ? (
      <div>
        <EuiFlexGroup
          alignItems="center"
          justifyContent="center"
          direction="column"
          style={dailyfeedtemplatestyle}
        >
          <EuiLoadingChart size="xl" />
        </EuiFlexGroup>
      </div>
    ) : (
      <div>
        {this.state.Viewmode == ViewMode.VIEW ? (
          <EuiFlexGroup style={DLIctrlstyle} direction="column">
            <EuiButtonIcon
              aria-label="toggleEditMode"
              onClick={() => this.toggleEditMode()}
              iconType="pencil"
            />
          </EuiFlexGroup>
        ) : (
          <EuiFlexGroup style={DLIctrlstyle} direction="column">
            <EuiButtonIcon
              aria-label="Save Changes"
              onClick={() => this.toggleEditMode(true)}
              iconType="save"
            />
            <EuiButtonIcon
              aria-label="Add Panel"
              onClick={() => this.AddPanel()}
              iconType="plusInCircleFilled"
            />
            <EuiButtonIcon
              aria-label="Cancel Changes"
              onClick={() => this.toggleEditMode()}
              iconType="cross"
            />
          </EuiFlexGroup>
        )}
        <div style={dailyfeedtemplatestyle}>
          {this.renderDashboard(this.state.FeedContainer, this.dashboardFactory)}
        </div>
      </div>
    );
  }
}
