import { CoreSetup, KibanaRequest, RequestHandlerContext } from 'src/core/server';
import { bulkAddCountObject } from 'plugins/spitting_alpaca/common/types';

export async function getDocCount(
  context: RequestHandlerContext,
  request: KibanaRequest,
  core: CoreSetup
) {
  let query: bulkAddCountObject = request.body as bulkAddCountObject;
  var { queryIndex } = request.body as { queryIndex: string };

  let parsedQueryIndex = queryIndex.replaceAll('"', '');

  let jsonQueryObject = JSON.parse(query.queryJson);

  var searchparams: any = {
    index: parsedQueryIndex,
    body: {
      query: jsonQueryObject,
    },
  };

  var response;
  var error;
  await (
    await context.core
  ).elasticsearch.client.asCurrentUser
    .count(searchparams)
    .then((res: any) => (response = res))
    .catch((err: any) => (error = err));

  return {
    body: {
      response: response,
      error: error,
    },
  };
}
