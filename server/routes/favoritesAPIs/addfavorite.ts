import { CoreSetup, KibanaRequest, RequestHandlerContext } from 'src/core/server';
import { FavoritedDash } from '../../../common/types';

export async function handleNewFavorite(
  context: RequestHandlerContext,
  request: KibanaRequest,
  core: CoreSetup
) {
  const newfavorite: FavoritedDash = request.body as FavoritedDash;
  let retval;
  if (newfavorite.dashid != null) {
    var createParams = {
      id: newfavorite.user + newfavorite.dashid,
      index: 'favorited-dashboards',
      body: {
        username: newfavorite.user,
        dashid: newfavorite.dashid,
        showquery: newfavorite.showquery,
        showtime: newfavorite.showtime,
        showfilter: newfavorite.showfilter,
        refreshInterval: newfavorite.refreshInterval,
        filters: newfavorite.filters,
        time: newfavorite.time,
        query: newfavorite.query,
      },
    };
    var createerr: { statusCode: number } = { statusCode: 60 };
    var updateres: { result: string } = { result: 'not updated' };

    (await context.core).elasticsearch.client.asCurrentUser
      .create(createParams)
      .catch((err: any) => {
        createerr = err;
      });
    if (createerr.statusCode == 409) {
      var updateparams = {
        id: newfavorite.user + newfavorite.dashid,
        index: 'favorited-dashboards',
        body: {
          doc: {
            username: newfavorite.user,
            dashid: newfavorite.dashid,
            showquery: newfavorite.showquery,
            showtime: newfavorite.showtime,
            showfilter: newfavorite.showfilter,
            refreshInterval: newfavorite.refreshInterval,
            filters: newfavorite.filters,
            time: newfavorite.time,
            query: newfavorite.query,
          },
        },
      };
      (await context.core).elasticsearch.client.asCurrentUser
        .update(updateparams)
        .then((res: any) => {
          updateres = res;
        })
        .catch((err: any) => {
          retval = err;
        });
    } else {
      retval == createerr;
    }

    if (createerr.statusCode == 60 || updateres.result == 'updated' || updateres.result == 'noop') {
      retval = true;
    }

    return {
      body: {
        time: new Date().toISOString(),
        successful: retval,
        createerr: createerr,
        updateres: updateres,
        request: newfavorite,
        createparams: createParams,
      },
    };
  }
}
