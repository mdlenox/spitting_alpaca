import { CoreSetup, KibanaRequest, RequestHandlerContext } from 'src/core/server';

export async function getFavorites(
  context: RequestHandlerContext,
  request: KibanaRequest,
  core: CoreSetup
) {
  var { username } = request.body as { username: string };
  let searchParams: any;

  searchParams = {
    index: 'favorited-dashboards',
    body: {
      query: {
        bool: {
          must: [{ match: { username: username } }, { exists: { field: 'dashid' } }],
        },
      },
    },
  };
  console.log(JSON.stringify(searchParams));

  var retval;
  var error;

  await (
    await context.core
  ).elasticsearch.client.asCurrentUser
    .search(searchParams)
    .then((res: any) => (retval = res))
    .catch((err) => (error = err));

  return {
    body: {
      time: new Date().toISOString(),
      ret: retval,
      err: error,
    },
  };
}
