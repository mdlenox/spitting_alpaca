import { RequestParams } from '@elastic/elasticsearch';
import { CoreSetup, KibanaRequest, RequestHandlerContext } from 'kibana/server';

export async function getDashboardNotes(
  context: RequestHandlerContext,
  request: KibanaRequest,
  core: CoreSetup
) {
  var { dashboardId } = request.body as { dashboardId: string };
  console.log(dashboardId);
  var searchparams: RequestParams.Search = {
    index: 'dashboard-notes',
    body: {
      sort: [
        {
          dateAdded: {
            order: 'desc',
          },
        },
      ],
      size: 10000,
      query: {
        bool: {
          must: {
            match_phrase: { 'dashboardId.keyword': dashboardId },
          },
        },
      },
    },
  };

  console.log(searchparams);

  var response;
  var error;
  await context.core.elasticsearch.client.asCurrentUser
    .search(searchparams)
    .then((res) => (response = res))
    .catch((err) => (error = err));

  return {
    body: {
      response: response,
      error: error,
    },
  };
}
