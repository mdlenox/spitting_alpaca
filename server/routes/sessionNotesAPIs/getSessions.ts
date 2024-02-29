import { RequestParams } from '@elastic/elasticsearch';
import { CoreSetup, KibanaRequest, RequestHandlerContext } from 'kibana/server';

export async function getSessions(
  context: RequestHandlerContext,
  request: KibanaRequest,
  core: CoreSetup
) {
  var searchparams: RequestParams.Search = {
    index: '.kibana',
    body: {
      size: 10000,
      query: {
        match: {
          type: 'query',
        },
      },
    },
  };

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
