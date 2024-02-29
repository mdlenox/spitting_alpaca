import { RequestParams } from '@elastic/elasticsearch';
import { CoreSetup, KibanaRequest, RequestHandlerContext } from 'kibana/server';

export async function checkIOCListName(
  context: RequestHandlerContext,
  request: KibanaRequest,
  core: CoreSetup
) {
  var { listName } = request.body as { listName: string };

  var searchparams: RequestParams.Search = {
    index: 'ioc-list',
    body: {
      query: {
        bool: {
          must: [{ match: { 'listName.keyword': listName } }],
        },
      },
    },
  };

  var response;
  var error;
  var checkStatus;
  await context.core.elasticsearch.client.asCurrentUser
    .search(searchparams)
    .then((res) => {
      response = res;
      if (res.body.hits.hits.length > 0) {
        //if there is a hit we return true
        checkStatus = true;
      } else {
        //if there isnt a hit
        checkStatus = false;
      }
    })
    .catch((err) => (error = err));

  return {
    body: {
      response: response,
      status: checkStatus,
      error: error,
    },
  };
}
