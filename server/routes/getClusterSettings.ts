import { RequestParams } from '@elastic/elasticsearch';
import { CoreSetup, KibanaRequest, RequestHandlerContext } from 'kibana/server';

export async function getClusterSettings(
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

  await context.core.elasticsearch.client.asInternalUser.cluster
    .getSettings(searchparams)
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
