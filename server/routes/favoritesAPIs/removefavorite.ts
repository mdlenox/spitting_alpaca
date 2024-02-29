import { CoreSetup, KibanaRequest, RequestHandlerContext } from 'src/core/server';

interface removeParams {
  username: string;
  dashid: string;
}

export async function handleRemoveFavorite(
  context: RequestHandlerContext,
  request: KibanaRequest,
  core: CoreSetup
) {
  const params: removeParams = request.body as removeParams;
  let retval = false;
  var createerr: { statusCode: number } = { statusCode: 60 };
  var createParams: any;
  console.log('REMOVE');
  try {
    if (params.dashid != null) {
      createParams = {
        index: 'favorited-dashboards',
        body: {
          query: {
            bool: {
              must: [
                { match: { username: params.username } },
                { match: { dashid: params.dashid } },
              ],
            },
          },
        },
      };
    }

    await (await context.core).elasticsearch.client.asCurrentUser.deleteByQuery(createParams);
  } catch (err) {
    console.log(err);
  }
  if (createerr.statusCode == 60) {
    retval = true;
  }

  return {
    body: {
      time: new Date().toISOString(),
      successful: retval,
    },
  };
}
