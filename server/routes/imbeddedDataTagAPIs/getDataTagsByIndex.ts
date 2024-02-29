import { RequestParams } from '@elastic/elasticsearch';
import { CoreSetup, KibanaRequest, RequestHandlerContext } from 'kibana/server';

export async function getDataTagsByIndex(
  context: RequestHandlerContext,
  request: KibanaRequest,
  core: CoreSetup
) {
  var { index } = request.body as { index: string };
  //   console.log('Generate Tags By Index');
  //   console.log(index);
  var searchparams: RequestParams.Search = {
    index: 'data-tags*',
    body: {
      size: 20,
      query: {
        bool: {
          must: [
            {
              match: {
                originalIndex: index,
              },
            },
          ],
        },
      },
    },
  };

  //   console.log(searchparams);

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
