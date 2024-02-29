import { SecurityGetUserResponse } from '@elastic/elasticsearch/lib/api/types';
import { CoreSetup, KibanaRequest, RequestHandlerContext } from 'src/core/server';

export async function getUser(
  context: RequestHandlerContext,
  request: KibanaRequest,
  core: CoreSetup
) {
  let error = {};
  let user: any = {};
  try {
    user = await (await context.core).elasticsearch.client.asCurrentUser.security.getUser();
    console.log(JSON.stringify(user));
  } catch (err) {
    console.log(err);
    error = err;
  }
  var retval = user;

  return {
    body: {
      time: new Date().toString(),
      username: retval,
      err: error,
    },
  };
}
