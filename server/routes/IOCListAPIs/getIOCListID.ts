import { RequestParams } from '@elastic/elasticsearch';
import { CoreSetup, KibanaRequest, RequestHandlerContext } from 'kibana/server';
import { IOCListIDLookup } from 'plugins/spitting_alpaca/common/types';

export async function handleGetIOCListID(
  context: RequestHandlerContext,
  request: KibanaRequest,
  core: CoreSetup
) {
  const IOCList: IOCListIDLookup = request.body as IOCListIDLookup;

  var searchparams: RequestParams.Search = {
    index: 'ioc-list',
    body: {
      size: 10000,

      query: {
        bool: {
          should: [
            {
              match_phrase: {
                'listName.keyword': IOCList.listName,
              },
            },
            {
              match_phrase: {
                creationDate: IOCList.creationDate,
              },
            },
          ],
        },
      },
    },
  };

  var response;
  var error;
  var status = 200;
  await context.core.elasticsearch.client.asCurrentUser
    .search(searchparams)
    .then((res) => (response = res))
    .catch((err) => {
      error = err;
      status = 400;
    });

  return {
    body: {
      response: response,
      error: error,
      status: status,
    },
  };
}
