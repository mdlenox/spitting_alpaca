import { schema } from '@kbn/config-schema';
import { CoreSetup, IRouter } from '../../../../src/core/server';
import { addTag } from './imbeddedDataTagAPIs/addTag';
import { handleNewFavorite } from './favoritesAPIs/addfavorite';
import { getUser } from './getUser';
import { getFavorites } from './favoritesAPIs/getFavorites';
import { handleRemoveFavorite } from './favoritesAPIs/removefavorite';
import { getAllTags } from './imbeddedDataTagAPIs/getTags';
import { handleGetHit } from './imbeddedDataTagAPIs/gethit';
import { GetDailyFeed as handleGetDailyFeed } from './favoritesAPIs/getDailyFeed';
import { handleDailyFeedUpdate } from './favoritesAPIs/updateDailyFeed';
import { deleteDataTag, deleteTagFromDoc, handleDeleteTag } from './imbeddedDataTagAPIs/deleteTag';
import { handleNewDashboardNote } from './dashboardNoteAPIs/addDashboardNote';
import { getDashboardNotes } from './dashboardNoteAPIs/getDashboardNotes';
import { getDashboardFavoritesTime } from './favoritesAPIs/getDashboardFavoritesTime';
import { handleDeleteDashboardNote } from './dashboardNoteAPIs/deleteDashboardNote';
import { getSessions } from './sessionNotesAPIs/getSessions';
import { getSessionNotes } from './sessionNotesAPIs/getSessionNotes';
import { handleNewSessionNote } from './sessionNotesAPIs/addSessionNote';
import { handleDeleteSessionNote } from './sessionNotesAPIs/deleteSessionNote';
import { getDataTagsByIndex } from './imbeddedDataTagAPIs/getDataTagsByIndex';
import { bulkQueryLookUp } from './BulkQueryAPIs/bulkQueryLookup';
import { handleNewIOCList } from './IOCListAPIs/addIOCList';
import { checkIOCListName } from './IOCListAPIs/checkIOCListName';
import { getIOCLists } from './IOCListAPIs/getioclists';
import { handleDeleteIOCList } from './IOCListAPIs/deleteIOCList';
import { handleGetIOCListID } from './IOCListAPIs/getIOCListID';
import { handleUpdateIOCList } from './IOCListAPIs/updateIOCList';
import { createTag } from './imbeddedDataTagAPIs/createTag';
import { checkDataTagName } from './imbeddedDataTagAPIs/checkDataTagName';
import { handleUpdateDataTag } from './imbeddedDataTagAPIs/updateDataTag';
import { deleteAllTags } from './imbeddedDataTagAPIs/deleteAllTags';
import { getDocCount } from './imbeddedDataTagAPIs/getDocCount';
import { bulkUpdateDocs } from './bulkAddDataTags/bulkUpdateDocs';
import { bulkDeleteDocs } from './bulkAddDataTags/bulkDeleteDocs';
import { getTagCountInDocuments } from './bulkAddDataTags/getTagCountInDocuments';
import { batchDeleteTags } from './bulkAddDataTags/batchDeleteTags';
import { deleteTagEntity } from './bulkAddDataTags/deleteTagEntity';
import { batchUpdateTags } from './bulkAddDataTags/batchUpdateTags';
import { getRoles } from './getRoles';
import { getConfig } from './controllerAPIs/getConfig';
import { postConfig } from './controllerAPIs/postConfig';
import { getClusterSettings } from './getClusterSettings';
import { getWatchers } from './getWatchers';
import { createIOCListWatcher } from './createWatcherAPIs/createIOCListWatcher';
import { getRootDocument } from './nutcrackerAPIs/getRootDocument';
import { SecurityPluginSetup } from '@kbn/security-plugin-types-public';

export function defineRoutes(
  router: IRouter,
  core: CoreSetup,
  security: SecurityPluginSetup | undefined
) {
  router.get(
    {
      path: '/api/spitting_alpaca/time',
      validate: false,
    },
    async (context, request, response) => {
      return response.ok({
        body: {
          time: new Date().toUTCString(),
        },
      });
    }
  );
  router.get(
    {
      path: '/api/spitting_alpaca/getuser',
      validate: false,
    },
    async (context, request, response) => {
      return response.ok(await getUser(context, request, core));
    }
  );

  router.post(
    {
      path: '/api/spitting_alpaca/getconfig',
      validate: {
        body: schema.object({
          url: schema.string(),
        }),
      },
    },
    async (context, request, response) => {
      return response.ok(await getConfig(request, core));
    }
  );

  router.post(
    {
      path: '/api/spitting_alpaca/postconfig',
      validate: {
        body: schema.object({
          url: schema.string(),
          data: schema.string(),
        }),
      },
    },
    async (context, request, response) => {
      return response.ok(await postConfig(request, core));
    }
  );
  router.get(
    {
      path: '/api/spitting_alpaca/getroles',
      validate: false,
    },
    async (context, request, response) => {
      return response.ok(getRoles(request, core));
      //
    }
  );
  router.get(
    {
      path: '/api/spitting_alpaca/getclustersettings',
      validate: false,
    },
    async (context, request, response) => {
      return response.ok(await getClusterSettings(context, request, core));
      //
    }
  );
  router.get(
    {
      path: '/api/spitting_alpaca/getwatchers',
      validate: false,
    },
    async (context, request, response) => {
      return response.ok(await getWatchers(context, request, core));
      //
    }
  );
  router.post(
    {
      path: '/api/spitting_alpaca/bulkupdatedocs',
      validate: {
        body: schema.object({
          tag: schema.arrayOf(schema.string()),
          queryJson: schema.string(),
          queryIndex: schema.string(),
        }),
      },
    },
    async (context, request, response) => {
      return response.ok(await bulkUpdateDocs(context, request, core));
      //
    }
  );

  router.post(
    {
      path: '/api/spitting_alpaca/bulkdeletedocs',
      validate: {
        body: schema.object({
          tag: schema.arrayOf(schema.string()),
          queryJson: schema.string(),
          queryIndex: schema.string(),
        }),
      },
    },
    async (context, request, response) => {
      return response.ok(await bulkDeleteDocs(context, request, core));
      //
    }
  );
  //gettagcountindocuments

  router.post(
    {
      path: '/api/spitting_alpaca/gettagcountindocuments',
      validate: {
        body: schema.object({
          index: schema.string(),
          query: schema.string(),
        }),
      },
    },
    async (context, request, response) => {
      return response.ok(await getTagCountInDocuments(context, request, core));
      //
    }
  );
  //batchUpdateTags
  router.post(
    {
      path: '/api/spitting_alpaca/batchupdatetags',
      validate: {
        body: schema.object({
          tags: schema.arrayOf(schema.string()),
          query: schema.string(),
          index: schema.string(),
          batchSize: schema.number(),
        }),
      },
    },
    async (context, request, response) => {
      return response.ok(await batchUpdateTags(context, request, core));
      //
    }
  );
  router.post(
    {
      path: '/api/spitting_alpaca/batchdeletetags',
      validate: {
        body: schema.object({
          tags: schema.arrayOf(schema.string()),
          query: schema.string(),
          index: schema.string(),
          batchSize: schema.number(),
        }),
      },
    },
    async (context, request, response) => {
      return response.ok(await batchDeleteTags(context, request, core));
      //
    }
  );
  router.post(
    {
      path: '/api/spitting_alpaca/getrootdocument',
      validate: {
        body: schema.object({
          id: schema.string(),
          index: schema.string(),
        }),
      },
    },
    async (context, request, response) => {
      return response.ok(await getRootDocument(context, request, core));
      //
    }
  );
  router.post(
    {
      path: '/api/spitting_alpaca/getdoccount',
      validate: {
        body: schema.object({
          queryJson: schema.string(),
          queryIndex: schema.string(),
        }),
      },
    },
    async (context, request, response) => {
      return response.ok(await getDocCount(context, request, core));
      //
    }
  );
  router.post(
    {
      path: '/api/spitting_alpaca/checkioclistname',
      validate: {
        body: schema.object({
          listName: schema.string(),
        }),
      },
    },
    async (context, request, response) => {
      return response.ok(await checkIOCListName(context, request, core));
    }
  );
  router.post(
    {
      path: '/api/spitting_alpaca/checkdatatagname',
      validate: {
        body: schema.object({
          tag: schema.string(),
        }),
      },
    },
    async (context, request, response) => {
      return response.ok(await checkDataTagName(context, request, core));
    }
  );
  router.post(
    {
      path: '/api/spitting_alpaca/getioclists',
      validate: false,
    },
    async (context, request, response) => {
      return response.ok(await getIOCLists(context, request, core));
    }
  );
  router.post(
    {
      path: '/api/spitting_alpaca/getsessions',
      validate: false,
    },
    async (context, request, response) => {
      return response.ok(await getSessions(context, request, core));
    }
  );
  router.post(
    {
      path: '/api/spitting_alpaca/getsessionnotes',
      validate: {
        body: schema.object({
          session: schema.string(),
        }),
      },
    },
    async (context, request, response) => {
      return response.ok(await getSessionNotes(context, request, core));
    }
  );
  router.post(
    {
      path: '/api/spitting_alpaca/getdashboardfavoritestime',
      validate: {
        body: schema.object({
          username: schema.string(),
          dashid: schema.string(),
        }),
      },
    },
    async (context, request, response) => {
      return response.ok(await getDashboardFavoritesTime(context, request, core));
    }
  );
  router.post(
    {
      path: '/api/spitting_alpaca/deleteDashboardNote',
      validate: {
        body: schema.object({
          username: schema.string(),
          timestamp: schema.string(),
          dashboardId: schema.string(),
          note: schema.string(),
          event: schema.string(),
          id: schema.string(),
        }),
      },
    },
    async (context, request, response) => {
      return response.ok(await handleDeleteDashboardNote(context, request, core));
      //
    }
  );
  //handleDeleteIOCList
  router.post(
    {
      path: '/api/spitting_alpaca/deleteioclist',
      validate: {
        body: schema.object({
          username: schema.string(),
          listName: schema.string(),
        }),
      },
    },
    async (context, request, response) => {
      return response.ok(await handleDeleteIOCList(context, request, core));
      //
    }
  );

  router.post(
    {
      path: '/api/spitting_alpaca/deletesessionnote',
      validate: {
        body: schema.object({
          username: schema.string(),
          timestamp: schema.string(),
          session: schema.string(),
          note: schema.string(),
          event: schema.string(),
          id: schema.string(),
        }),
      },
    },
    async (context, request, response) => {
      return response.ok(await handleDeleteSessionNote(context, request, core));
      //
    }
  );
  router.post(
    {
      path: '/api/spitting_alpaca/getfavorites',
      validate: {
        body: schema.object({
          username: schema.string(),
        }),
      },
    },
    async (context, request, response) => {
      return response.ok(await getFavorites(context, request, core));
      //
    }
  );
  router.get(
    {
      path: '/api/spitting_alpaca/getdailyfeed',
      validate: false,
    },
    async (context, request, response) => {
      return response.ok(await handleGetDailyFeed(context, request, core));
      //
    }
  );
  router.post(
    {
      path: '/api/spitting_alpaca/getioclistid',
      validate: {
        body: schema.object({
          listName: schema.string(),
          creationDate: schema.string(),
        }),
      },
    },
    async (context, request, response) => {
      return response.ok(await handleGetIOCListID(context, request, core));
      //
    }
  );
  router.post(
    {
      path: '/api/spitting_alpaca/updateioclist',
      validate: {
        body: schema.object({
          username: schema.string(),
          IOCList: schema.string(),
          listName: schema.string(),
          creationDate: schema.string(),
          updateDate: schema.string(),
          hasUpdated: schema.boolean(),
          id: schema.string(),
          description: schema.string(),
          additionalUsers: schema.arrayOf(schema.string()),
        }),
      },
    },
    async (context, request, response) => {
      return response.ok(await handleUpdateIOCList(context, request, core));
      //
    }
  );
  router.post(
    {
      path: '/api/spitting_alpaca/updatedatatag',
      validate: {
        body: schema.object({
          updateID: schema.string(),
          tag: schema.string(),
          details: schema.string(),
          owner: schema.string(),
          users: schema.arrayOf(schema.string()),
          timestamp: schema.string(),
        }),
      },
    },
    async (context, request, response) => {
      return response.ok(await handleUpdateDataTag(context, request, core));
      //
    }
  );
  router.post(
    {
      path: '/api/spitting_alpaca/deletealltags',
      validate: {
        body: schema.object({
          tag: schema.string(),
          owner: schema.string(),
          deleteOption: schema.number(),
        }),
      },
    },
    async (context, request, response) => {
      return response.ok(await deleteAllTags(context, request, core));
      //
    }
  );
  router.post(
    {
      path: '/api/spitting_alpaca/deletetagentity',
      validate: {
        body: schema.object({
          tag: schema.string(),
          owner: schema.string(),
        }),
      },
    },
    async (context, request, response) => {
      return response.ok(await deleteTagEntity(context, request, core));
      //
    }
  );
  router.post(
    {
      path: '/api/spitting_alpaca/getalltags',
      validate: false,
    },
    async (context, request, response) => {
      return response.ok(await getAllTags(context, request, core));
    }
  );
  router.post(
    {
      path: '/api/spitting_alpaca/gethit',
      validate: {
        body: schema.object({
          hitId: schema.any(),
          index: schema.any(),
        }),
      },
    },
    async (context, request, response) => {
      return response.ok(await handleGetHit(context, request, core));
      //
    }
  );
  router.post(
    {
      path: '/api/spitting_alpaca/getdashboardnotes',
      validate: {
        body: schema.object({
          dashboardId: schema.any(),
        }),
      },
    },
    async (context, request, response) => {
      return response.ok(await getDashboardNotes(context, request, core));
    }
  );
  router.post(
    {
      path: '/api/spitting_alpaca/getdatatagsbyindex',
      validate: {
        body: schema.object({
          index: schema.string(),
        }),
      },
    },
    async (context, request, response) => {
      return response.ok(await getDataTagsByIndex(context, request, core));
    }
  );
  router.post(
    {
      path: '/api/spitting_alpaca/deletetag',
      validate: {
        body: schema.object({
          username: schema.string(),
          rawtime: schema.number(),
          timestamp: schema.string(),
          originalId: schema.string(),
          originalIndex: schema.string(),
          fieldname: schema.string(),
          fieldval: schema.any(),
          tag: schema.string(),
          applytoall: schema.boolean(),
        }),
      },
    },
    async (context, request, response) => {
      return response.ok(await handleDeleteTag(context, request, core));
      //
    }
  );
  router.put(
    {
      path: '/api/spitting_alpaca/addnote',
      validate: {
        body: schema.object({
          username: schema.string(),
          timestamp: schema.string(),
          dashboardId: schema.string(),
          note: schema.string(),
          event: schema.string(),
          dateAdded: schema.string(),
          id: schema.string(),
        }),
      },
    },
    async (context, request, response) => {
      return response.ok(await handleNewDashboardNote(context, request, core));
    }
  );
  router.put(
    {
      path: '/api/spitting_alpaca/createioclistwatcher',
      validate: {
        body: schema.object({
          watcher: schema.any(),
        }),
      },
    },
    async (context, request, response) => {
      return response.ok(await createIOCListWatcher(context, request, core));
    }
  );
  router.put(
    {
      path: '/api/spitting_alpaca/addsessionnote',
      validate: {
        body: schema.object({
          username: schema.string(),
          timestamp: schema.string(),
          session: schema.string(),
          note: schema.string(),
          event: schema.string(),
          dateAdded: schema.string(),
          id: schema.string(),
        }),
      },
    },
    async (context, request, response) => {
      return response.ok(await handleNewSessionNote(context, request, core));
    }
  );
  router.put(
    {
      path: '/api/spitting_alpaca/addioclist',
      validate: {
        body: schema.object({
          username: schema.string(),
          listName: schema.string(),
          IOCList: schema.string(),
          creationDate: schema.string(),
          updateDate: schema.string(),
          hasUpdated: schema.boolean(),
          additionalUsers: schema.arrayOf(schema.string()),
          description: schema.string(),
          listSource: schema.string(),
        }),
      },
    },
    async (context, request, response) => {
      return response.ok(await handleNewIOCList(context, request, core));
    }
  );

  router.put(
    {
      path: '/api/spitting_alpaca/addtag',
      validate: {
        body: schema.object({
          id: schema.string(),
          tag: schema.arrayOf(schema.string()),
          index: schema.string(),
        }),
      },
    },
    async (context, request, response) => {
      return response.ok(await addTag(context, request, core));
    }
  );

  router.put(
    {
      path: '/api/spitting_alpaca/createtag',
      validate: {
        body: schema.object({
          username: schema.string(),
          tag: schema.string(),
          details: schema.string(),
          users: schema.arrayOf(schema.string()),
        }),
      },
    },
    async (context, request, response) => {
      return response.ok(await createTag(context, request, core));
    }
  );

  router.put(
    {
      path: '/api/spitting_alpaca/deletetagfromdoc',
      validate: {
        body: schema.object({
          id: schema.string(),
          tag: schema.arrayOf(schema.string()),
          index: schema.string(),
        }),
      },
    },
    async (context, request, response) => {
      return response.ok(await deleteTagFromDoc(context, request, core));
    }
  );

  router.put(
    {
      path: '/api/spitting_alpaca/bulkquerylookup',
      validate: {
        body: schema.object({
          index: schema.string(),
          field: schema.string(),
          size: schema.number(),
          bulkQueryValue: schema.arrayOf(schema.string()),
          filters: schema.arrayOf(
            schema.object({
              filterField: schema.string(),
              filterOperator: schema.string(),
              filterTextValue: schema.string(),
            })
          ),
        }),
      },
    },
    async (context, request, response) => {
      return response.ok(await bulkQueryLookUp(context, request, core));
    }
  );
  router.put(
    {
      path: '/api/spitting_alpaca/addfavorite',
      validate: {
        body: schema.object({
          user: schema.string(),
          dashid: schema.string(),
          showquery: schema.boolean(),
          showtime: schema.boolean(),
          showfilter: schema.boolean(),
          filters: schema.maybe(schema.arrayOf(schema.object({}, { unknowns: 'allow' }))),
          time: schema.maybe(
            schema.object({ from: schema.string(), to: schema.string() }, { unknowns: 'allow' })
          ),
          query: schema.maybe(
            schema.object(
              { query: schema.string(), language: schema.string() },
              { unknowns: 'allow' }
            )
          ),
          refreshInterval: schema.object({ value: schema.number(), pause: schema.boolean() }),
        }),
      },
    },
    async (context, request, response) => {
      return response.ok(await handleNewFavorite(context, request, core));
    }
  );
  router.post(
    {
      path: '/api/spitting_alpaca/removefavorite',
      validate: {
        body: schema.object({
          username: schema.string(),
          dashid: schema.string(),
        }),
      },
    },
    async (context, request, response) => {
      return response.ok(await handleRemoveFavorite(context, request, core));
      //
    }
  );
  router.put(
    {
      path: '/api/spitting_alpaca/updatedailyfeed',
      validate: {
        body: schema.object({
          panels: schema.any(),
        }),
      },
    },
    async (context, request, response) => {
      return response.ok(await handleDailyFeedUpdate(context, request, core));
    }
  );
}
