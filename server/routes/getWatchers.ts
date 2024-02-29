import { RequestParams } from '@elastic/elasticsearch';
import { CoreSetup, KibanaRequest, RequestHandlerContext } from 'kibana/server';

export async function getWatchers(
  context: RequestHandlerContext,
  request: KibanaRequest,
  core: CoreSetup
) {
  var response;
  var error;
  var checkStatus;

  await context.core.elasticsearch.client.asInternalUser.watcher
    .queryWatches()
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
