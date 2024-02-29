import { RequestParams } from '@elastic/elasticsearch';
import { CoreSetup, KibanaRequest, RequestHandlerContext } from 'kibana/server';

export async function handleGetHit(
  context: RequestHandlerContext,
  request: KibanaRequest,
  core: CoreSetup
) {
  var { hitId } = request.body as { hitId: string };
  var { index } = request.body as { index: string };

  console.log(index);

  var searchparams: RequestParams.Search = {
    index: index,
    body: {
      query: {
        terms: {
          _id: [hitId],
        },
      },
    },
  };

  console.log('Get HiTs Search');
  console.log(JSON.stringify(searchparams));

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
