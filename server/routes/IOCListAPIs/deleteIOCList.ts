import { CoreSetup, KibanaRequest, RequestHandlerContext } from 'kibana/server';
import { IOCList } from '../../../common/types';
import { AuthenticatedUser } from 'x-pack/plugins/security/public';
import { RequestParams } from '@elastic/elasticsearch';

export async function handleDeleteIOCList(
  context: RequestHandlerContext,
  request: KibanaRequest,
  core: CoreSetup
) {
  var userauth: AuthenticatedUser = core.http.auth.get(request).state as AuthenticatedUser;
  const IOCListToDelete: IOCList = request.body as IOCList;
  var retval: string = '';
  let code: string = '';

  // if (IOCListToDelete.username == userauth.username) {
  var searchparams: RequestParams.Search = {
    index: 'ioc-list',
    body: {
      query: {
        bool: {
          must: [
            { match_phrase: { 'username.keyword': IOCListToDelete.username } },
            { match_phrase: { 'listName.keyword': IOCListToDelete.listName } },
          ],
        },
      },
    },
  };

  await context.core.elasticsearch.client.asCurrentUser.deleteByQuery(searchparams).then((res) => {
    console.log(res);
    if (res.body.total == 1 && res.body.deleted == 1) {
      retval = 'IOC List deleted successfully';
      code = '200';
      return {
        body: {
          ret: retval,
          code: code,
        },
      };
    } else {
      retval = 'Error: IOC List was not deleted';
      code = '400';
      return {
        body: {
          ret: retval,
          code: code,
        },
      };
    }
  });
  // } else {
  //   retval = 'Error: IOC List was not deleted-Username did not match ';
  //   code = '400';
  //   return {
  //     body: {
  //       ret: retval,
  //       code: code,
  //     },
  //   };
  // }
  return {
    body: {
      time: new Date().toISOString(),
      ret: retval,
      code: code,
    },
  };
}
