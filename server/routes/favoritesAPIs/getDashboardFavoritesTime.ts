import { CoreSetup, KibanaRequest, RequestHandlerContext } from 'src/core/server';
import { GetDashboardFavoritesTimeOptions } from 'plugins/spitting_alpaca/common/types';

export async function getDashboardFavoritesTime(
  context: RequestHandlerContext,
  request: KibanaRequest,
  core: CoreSetup
) {
  const dashboardOptions: GetDashboardFavoritesTimeOptions =
    request.body as GetDashboardFavoritesTimeOptions;

  var searchparams: any = {
    index: 'favorited-dashboards',
    body: {
      query: {
        bool: {
          must: [
            { match: { username: dashboardOptions.username } },
            { match: { dashid: dashboardOptions.dashid } },
          ],
        },
      },
    },
  };

  var retval;
  var error;

  await (
    await context.core
  ).elasticsearch.client.asCurrentUser
    .search(searchparams)
    .then((res: any) => (retval = res))
    .catch((err: any) => (error = err));

  return {
    body: {
      time: new Date().toISOString(),
      ret: retval,
      err: error,
    },
  };
}
