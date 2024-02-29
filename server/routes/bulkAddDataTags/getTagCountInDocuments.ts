import { RequestParams } from '@elastic/elasticsearch';
import { CoreSetup, KibanaRequest, RequestHandlerContext } from 'kibana/server';

//gets the tag count in all the documents and all indexes
export async function getTagCountInDocuments(
  context: RequestHandlerContext,
  request: KibanaRequest,
  core: CoreSetup
) {
  interface params {
    index: string;
    query: string;
  }

  var params: params = request.body as params;

  let query = JSON.parse(params.query);

  var searchParams: any = {
    index: params.index.replaceAll('"', ''),
    expand_wildcards: 'all',
    body: {
      query,
    },
  };

  console.log(JSON.stringify(searchParams));

  var response;
  var error;
  await context.core.elasticsearch.client.asCurrentUser
    .count(searchParams)
    .then((res) => (response = res))
    .catch((err) => (error = err));

  return {
    body: {
      response: response,
      error: error,
    },
  };
}
