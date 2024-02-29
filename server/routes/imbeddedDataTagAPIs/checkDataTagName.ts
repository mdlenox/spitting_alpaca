import { CoreSetup, KibanaRequest, RequestHandlerContext } from 'src/core/server';

export async function checkDataTagName(
  context: RequestHandlerContext,
  request: KibanaRequest,
  core: CoreSetup
) {
  var { tag } = request.body as { tag: string };

  var searchparams: any = {
    index: 'data-tags',
    body: {
      query: {
        bool: {
          must: [{ match: { 'tag.keyword': tag } }],
        },
      },
    },
  };

  var response;
  var error;
  var checkStatus;
  await (
    await context.core
  ).elasticsearch.client.asCurrentUser
    .search(searchparams)
    .then((res) => {
      response = res;
      if (res.hits.hits.length > 0) {
        //if there is a hit we return true
        checkStatus = false;
      } else {
        //if there isnt a hit
        checkStatus = true;
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
