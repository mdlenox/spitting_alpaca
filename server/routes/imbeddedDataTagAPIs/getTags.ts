import { CoreSetup, KibanaRequest, RequestHandlerContext } from 'src/core/server';

export async function getAllTags(
  context: RequestHandlerContext,
  request: KibanaRequest,
  core: CoreSetup
) {
  let response: any[] = [];
  var error;
  var searchparams: any = {
    index: 'data-tags',
    body: {
      size: 10000,
      query: {
        match_all: {},
      },
    },
  };

  await (
    await context.core
  ).elasticsearch.client.asCurrentUser
    .search(searchparams)
    .then((res: any) => {
      //set the oringinal response
      console.log(JSON.stringify(res));
      response = res.hits.hits;
    })
    .catch((err) => (error = err));
  return {
    body: {
      response: response,
      error: error,
    },
  };
}
