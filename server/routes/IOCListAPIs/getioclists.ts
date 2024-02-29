import { RequestParams } from '@elastic/elasticsearch';
import { CoreSetup, KibanaRequest, RequestHandlerContext } from 'kibana/server';

export async function getIOCLists(
  context: RequestHandlerContext,
  request: KibanaRequest,
  core: CoreSetup
) {
  var searchparams: RequestParams.Search = {
    index: 'ioc-list',
    size: 10000,
    body: {
      query: {
        match_all: {},
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
