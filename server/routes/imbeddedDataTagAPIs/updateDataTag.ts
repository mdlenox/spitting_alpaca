import { CoreSetup, KibanaRequest, RequestHandlerContext } from 'kibana/server';
import { DataTagUpdate } from '../../../common/types';
import { AuthenticatedUser } from 'x-pack/plugins/security/public';
import { ApiResponse } from '@elastic/elasticsearch';
import { Context } from '@elastic/elasticsearch/lib/Transport';
export async function handleUpdateDataTag(
  context: RequestHandlerContext,
  request: KibanaRequest,
  core: CoreSetup
) {
  const dataTag: DataTagUpdate = request.body as DataTagUpdate;
  const userauth: AuthenticatedUser = core.http.auth.get(request).state as AuthenticatedUser;
  var retVal: boolean | ApiResponse<Record<string, any>, Context> = false;

  let error: any = {};

  if (dataTag.owner != null && dataTag.owner === userauth.username) {
    var createParams = {
      id: dataTag.updateID,
      index: 'data-tags',
      refresh: true,
      body: {
        doc: {
          tag: dataTag.tag,
          details: dataTag.details,
          owner: dataTag.owner,
          users: dataTag.users,
          timestamp: dataTag.timestamp,
        },
      },
    };

    var status: any = 200;

    await context.core.elasticsearch.client.asCurrentUser
      .update(createParams)
      .then((res: any) => {
        retVal = res;
      })
      .catch((err) => {
        status = 400;
        error = err;
      });
  } else {
    var status: any = 200;
    error = 501;
  }

  return {
    body: {
      time: new Date().toISOString(),
      res: retVal,
      status: status,
      error: error,
    },
  };
}
