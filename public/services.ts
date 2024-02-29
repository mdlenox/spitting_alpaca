import { CoreSetup, CoreStart } from '../../../src/core/public';
import { DataViewsContract, TimeHistoryContract } from '../../../src/plugins/data/public';
import { createGetterSetter, Storage } from '../../../src/plugins/kibana_utils/public';
import { GenDailyFeed } from './components/user_workspace/dailyfeed/genDailyFeed';
import { AppPluginSetupDependencies, AppPluginStartDependencies } from './types';
import { AuthenticatedUser } from '@kbn/security-plugin-types-common';

type IStorageEngine = typeof window.localStorage;

export const [getCore, setCore] = createGetterSetter<CoreStart>('core');

export const [getPlugins, setPlugins] = createGetterSetter<AppPluginStartDependencies>('plugins');

export const [getCoreSetup, setCoreSetup] = createGetterSetter<CoreSetup>('coresetup');
export const [getCurrentUser, setCurrentUser] = createGetterSetter<AuthenticatedUser>('user');

export const [getPluginsSetup, setPluginsSetup] =
  createGetterSetter<AppPluginSetupDependencies>('pluginssetup');

export const [getGenDailyFeedObj, setGenDailyFeedObj] =
  createGetterSetter<GenDailyFeed>('GenDailyFeed');

export const [getNotesUpdate, setNotesUpdate] = createGetterSetter<() => void>('NotesUpdate');

export const [getDiscoverUpdate, setDiscoverUpdate] =
  createGetterSetter<() => void>('DiscoverUpdate');

// export const [getIndexPatterns, setIndexPatterns] =
//   createGetterSetter<IndexPatternsContract>('IndexPatterns');

export const [getDataViews, setDataViews] = createGetterSetter<DataViewsContract>('IndexPatterns');

// export async function genDataViewList(dataViewContract: DataViewsContract) {
//   await dataViewContract.getIds().then(async (ids) => {
//     var dataViews: DataViewsServicePublic;
//     await Promise.all(
//       ids.map(
//         async (id) =>
//           await dataViewContract.get(id).then((dataView: any) => dataViews.push(dataView))
//       )
//     );
//     setDataViews(dataViews);
//   });
// }

// export async function genIndexPattensList(indexContract: DataViewsContract) {
//   await indexContract.getIds().then(async (ids) => {
//     var indexPatterns: DataView[] = [];
//     await Promise.all(
//       ids.map(
//         async (id) =>
//           await indexContract.get(id).then((indexPattern) => indexPatterns.push(indexPattern))
//       )
//     );
//     setDataViews(indexPatterns);
//   });
// }

// export const [getIndexPatternsList, setIndexPatternsList] =
//   createGetterSetter<IndexPattern[]>('IndexPatternsList');

export function createStorage(engine: IStorageEngine) {
  return new Storage(engine);
}

export const [getStorage, setStorage] = createGetterSetter<Storage>('Storage');
export const [getTimeHistory, setTimeHistory] =
  createGetterSetter<TimeHistoryContract>('TimeHistory');
