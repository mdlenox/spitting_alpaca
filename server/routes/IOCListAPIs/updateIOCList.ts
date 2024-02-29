import { CoreSetup, KibanaRequest, RequestHandlerContext } from 'kibana/server';
import { IOCListUpdate } from '../../../common/types';
import { AuthenticatedUser } from 'x-pack/plugins/security/public';
import { ApiResponse } from '@elastic/elasticsearch';
import { Context } from '@elastic/elasticsearch/lib/Transport';
export async function handleUpdateIOCList(
  context: RequestHandlerContext,
  request: KibanaRequest,
  core: CoreSetup
) {
  const iocListUpdate: IOCListUpdate = request.body as IOCListUpdate;
  const userauth: AuthenticatedUser = core.http.auth.get(request).state as AuthenticatedUser;
  var retVal: boolean | ApiResponse<Record<string, any>, Context> = false;

  if (iocListUpdate.username != null) {
    var createParams = {
      id: iocListUpdate.id,
      index: 'ioc-list',
      refresh: true,
      body: {
        doc: {
          username: iocListUpdate.username,
          IOCList: iocListUpdate.IOCList,
          listName: iocListUpdate.listName,
          creationDate: iocListUpdate.creationDate,
          updateDate: iocListUpdate.updateDate,
          hasUpdated: iocListUpdate.hasUpdated,
          description: iocListUpdate.description,
          additionalUsers: iocListUpdate.additionalUsers,
        },
      },
    };

    var status: any = 200;
    let error: any = {};

    await context.core.elasticsearch.client.asCurrentUser
      .update(createParams)
      .then((res: any) => {
        retVal = res;
      })
      .catch((err) => {
        status = 400;
        error = err;
      });
    return {
      body: {
        time: new Date().toISOString(),
        res: retVal,
        status: status,
        error: error,
      },
    };
  }
}
