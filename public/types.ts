import { DiscoverSetup } from '../../../src/plugins/discover/public';
import {
  NavigationPublicPluginSetup,
  NavigationPublicPluginStart,
} from '../../../src/plugins/navigation/public';
import { CoreSetup } from '../../../src/core/public';
import { EmbeddableSetup, EmbeddableStart } from 'src/plugins/embeddable/public';
import { UiActionsSetup, UiActionsStart } from 'src/plugins/ui_actions/public';
import { Setup, Start as InspectorStart } from '../../../src/plugins/inspector/public';
import { DashboardStart } from 'src/plugins/dashboard/public';
import { DataPublicPluginStart } from 'src/plugins/data/public';
import { FavoritedDash } from '../common/types';
import { DataSetupDependencies } from 'src/plugins/data/public/types';
import { SecurityPluginSetup } from '@kbn/security-plugin/public';

export interface SpittingAlpacaPluginSetup {
  getGreeting: () => string;
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SpittingAlpacaPluginStart {}

export interface AppPluginStartDependencies {
  data: DataPublicPluginStart;
  navigation: NavigationPublicPluginStart;
  embeddable: EmbeddableStart;
  inspector: InspectorStart;
  uiActions: UiActionsStart;
  dashboard: DashboardStart;
}
export interface AppPluginSetupDependencies {
  navigation: NavigationPublicPluginSetup;
  discover: DiscoverSetup;
  embeddable: EmbeddableSetup;
  uiActions: UiActionsSetup;
  inspector: Setup;
  data: DataSetupDependencies;
  security: SecurityPluginSetup;
}

export interface FullSetup {
  core: CoreSetup;
  plugins: AppPluginSetupDependencies;
}

export interface Favorites {
  favoriteslist: FavoritedDash[];
  setFavoritesList: React.Dispatch<React.SetStateAction<FavoritedDash[] | undefined>>;
}
export enum FilterStateStore {
  APP_STATE = 'appState',
  GLOBAL_STATE = 'globalState',
}
export enum FILTERS {
  CUSTOM = 'custom',
  PHRASES = 'phrases',
  PHRASE = 'phrase',
  EXISTS = 'exists',
  MATCH_ALL = 'match_all',
  MISSING = 'missing',
  QUERY_STRING = 'query_string',
  RANGE = 'range',
  GEO_BOUNDING_BOX = 'geo_bounding_box',
  GEO_POLYGON = 'geo_polygon',
  SPATIAL_FILTER = 'spatial_filter',
}

export type FilterState = {
  store: FilterStateStore;
};

export type FilterMeta = {
  alias: string | null;
  disabled: boolean;
  negate: boolean;
  // controlledBy is there to identify who owns the filter
  controlledBy?: string;
  // index and type are optional only because when you create a new filter, there are no defaults
  index?: string;
  type?: string;
  key?: string;
  params?: any;
  value?: string;
};

export type Filter = {
  $state?: FilterState;
  meta: FilterMeta;
  query?: any;
};

export const isFilterPinned = (filter: Filter) => {
  return filter.$state && filter.$state.store === FilterStateStore.GLOBAL_STATE;
};
