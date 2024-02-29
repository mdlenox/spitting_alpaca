import { RequestParams } from '@elastic/elasticsearch';
import { WatcherPutWatchRequest } from '@elastic/elasticsearch/lib/api/typesWithBodyKey';
import { CoreSetup, KibanaRequest, RequestHandlerContext } from 'kibana/server';

export async function createIOCListWatcher(
  context: RequestHandlerContext,
  request: KibanaRequest,
  core: CoreSetup
) {
  var searchparams: RequestParams.Search = {
    include_defaults: true,
  };

  var response;
  var error;
  var checkStatus;

  var watcherObject: { watcher: any } = request.body as { watcher: any };

  await context.core.elasticsearch.client.asCurrentUser.watcher
    .putWatch(watcherObject.watcher)
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
