import { setStateToKbnUrl } from '../../../../../../src/plugins/kibana_utils/public';
import { TimeRange, Query, DataViewBase } from '@kbn/es-query';
import { SearchBar } from '@kbn/unified-search-plugin/public';
import { Filter } from '@kbn/es-query';
import { FavoritedDash } from '../../../../common/types';
import { AppPluginStartDependencies, Favorites } from '../../../types';
import { searchtemplatestyle } from '../../../styles';
import { getStorage, getTimeHistory } from '../../../services';
// import { NotesMenuManager } from '../../analyst_notes/dashNotesMenuManager';
import { CoreStart } from 'src/core/public';
import React, { Component } from 'react';
import { EuiButton, EuiSpacer, OnRefreshProps } from '@elastic/eui';
import { I18nProvider } from '@kbn/i18n-react';
import { KibanaContextProvider } from '../../../../../../src/plugins/kibana_react/public';

interface SearchProps {
  core: CoreStart;
  plugins: AppPluginStartDependencies;
  fav: FavoritedDash;
  favorites: Favorites;
  SetTime: (time: TimeRange) => void;
  SetQuery: (query: Query) => void;
}

interface SearchState {
  dataViews?: DataViewBase[];
}

export class SearchBarContainer extends Component<SearchProps, SearchState> {
  // private container = document.createElement('div');
  // private notesmenu:{
  //   toggleContextMenu: (anchorElement: HTMLElement) => void;
  // };
  constructor(props: SearchProps) {
    super(props);
    // const coreSetup = getCoreSetup();
    // const pluginsSetup = getPluginsSetup();
    // var setup = { core: coreSetup, plugins: pluginsSetup };
    // var notesmgr = new NotesMenuManager()
    // this.notesmenu = notesmgr.start(setup);
    // this.state={
    //   dataViews:getDataViews()
    // }
  }
  updateFilters(filters: Filter[]) {
    var updatedfavlist: FavoritedDash[] = this.props.favorites.favoriteslist;
    updatedfavlist.forEach((fav: FavoritedDash, ndx: number) => {
      if (fav.dashid == this.props.fav.dashid) {
        updatedfavlist[ndx].filters = filters;
        updatedfavlist[ndx].showfilter = true;
        this.props.favorites.setFavoritesList(updatedfavlist);
      }
    });
  }

  updateTime = (newTime: TimeRange) => {
    var updatedfavlist: FavoritedDash[] = this.props.favorites.favoriteslist;
    updatedfavlist.forEach((fav: FavoritedDash, ndx: number) => {
      if (fav.dashid == this.props.fav.dashid) {
        updatedfavlist[ndx].time = newTime;
        updatedfavlist[ndx].showtime = true;
        this.props.SetTime(newTime);
        this.props.favorites.setFavoritesList(updatedfavlist);
      }
    });
  };

  updateQuery = (newQuery: Query) => {
    var updatedfavlist: FavoritedDash[] = this.props.favorites.favoriteslist;
    updatedfavlist.forEach((fav: FavoritedDash, ndx: number) => {
      if (fav.dashid == this.props.fav.dashid) {
        updatedfavlist[ndx].query = newQuery;
        updatedfavlist[ndx].showquery = true;
        this.props.SetQuery(newQuery);
        this.props.favorites.setFavoritesList(updatedfavlist);
      }
    });
  };

  onQueryChange = (payload: { dateRange: TimeRange; query?: Query }) => {
    if (payload.dateRange != this.props.fav.time) this.updateTime(payload.dateRange);
    if (payload.query) this.updateQuery(payload.query);
  };

  onQuerySubmit = (payload: { dateRange: TimeRange; query?: Query }, isupdate?: boolean) => {
    //if (isupdate == true)
    this.onQueryChange(payload);
  };

  onRefreshChange = (options: { isPaused: boolean; refreshInterval: number }) => {
    var updatedfavlist: FavoritedDash[] = this.props.favorites.favoriteslist;
    updatedfavlist.forEach((fav: FavoritedDash, ndx: number) => {
      if (fav.dashid == this.props.fav.dashid) {
        updatedfavlist[ndx].refreshInterval = {
          pause: options.isPaused,
          value: options.refreshInterval,
        };
        this.props.favorites.setFavoritesList(updatedfavlist);
      }
    });
  };

  onTimeChange = ({
    start,
    end,
    isInvalid,
    isQuickSelection,
  }: {
    start: string;
    end: string;
    isInvalid: boolean;
    isQuickSelection: boolean;
  }) => {
    this.updateTime({ from: start, to: end });
  };

  onRefresh({ start, end }: OnRefreshProps) {
    this.updateTime({ from: start, to: end });
  }

  toggleAnalystNotes() {
    var fav = this.props.fav;
    var defaulttime = this.props.plugins.data.query.timefilter.timefilter.getTime();
    //populate url state
    var g: any = {
      filters: fav.showfilter ? fav.filters! : [],
      time: fav.showtime ? fav.time! : defaulttime,
      refreshInterval: fav.refreshInterval,
    };
    var a: any = {
      filters: fav.showfilter ? fav.filters! : [],
      query: fav.showquery ? fav.query! : { query: '', language: 'kuery' },
    };
    window.location.href = setStateToKbnUrl('_g', g);
    window.location.href = setStateToKbnUrl('_a', a);

    // this.notesmenu.toggleContextMenu(this.container)
  }

  render() {
    console.log(this.props.core);

    /*
    const commonlyUsedRanges = this.props.core.uiSettings!
      .get(UI_SETTINGS.TIMEPICKER_QUICK_RANGES)
      .map(({ from, to, display }: { from: string; to: string; display: string }) => {
        return {
        start: from,
        end: to,
        label: display,
        };
      });
    const wrapperClasses = classNames('kbnQueryBar__datePickerWrapper', {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'kbnQueryBar__datePickerWrapper-isHidden': false,
      });
  */
    var defaulttime = this.props.plugins.data.query.timefilter.timefilter.getTime();
    var time = this.props.fav.showtime ? this.props.fav.time! : defaulttime;
    var query = this.props.fav.showquery ? this.props.fav.query! : { query: '', language: 'Kuery' };

    return (
      <I18nProvider>
        <div style={searchtemplatestyle}>
          <EuiSpacer size="l" />
          <div style={{ float: 'right', marginRight: '1.5%' }}>
            <EuiButton color="primary" size="m" onClick={() => this.toggleAnalystNotes()}>
              AnalystNotes
            </EuiButton>
          </div>
          <KibanaContextProvider
            services={{ ...this.props.core, ...this.props.plugins, storage: getStorage() }}
          >
            <SearchBar
              isLoading={false}
              // indexPatterns={this.state.dataViews}
              timeHistory={getTimeHistory()}
              filters={this.props.fav.showfilter ? this.props.fav.filters! : []}
              onFiltersUpdated={this.updateFilters}
              dateRangeFrom={time.from}
              dateRangeTo={time.to}
              isRefreshPaused={this.props.fav.refreshInterval.pause}
              refreshInterval={this.props.fav.refreshInterval.value}
              query={query}
              showQueryInput={true}
              showSaveQuery={false}
              onQueryChange={this.onQueryChange}
              onQuerySubmit={this.onQuerySubmit}
              onRefresh={(props: { dateRange: any }) => this.updateTime(props.dateRange)}
              onRefreshChange={this.onRefreshChange}
            />
          </KibanaContextProvider>
        </div>
      </I18nProvider>
    );
  }
}
