import { RequestParams } from '@elastic/elasticsearch';
import { CoreSetup, KibanaRequest, RequestHandlerContext } from 'kibana/server';

export async function getSessionNotes(
  context: RequestHandlerContext,
  request: KibanaRequest,
  core: CoreSetup
) {
  var { session } = request.body as { session: string };
  console.log(session)
  var searchparams: RequestParams.Search = {
    index: 'session-notes',
    body: {
      sort: [
        {
          dateAdded: {
            order: "desc"
          }
        }
      ],
      size: 10000,
      query: {
            match_phrase: { "session.keyword": session,}
      },
    },
  };

  var response;
  var error;
  await context.core.elasticsearch.client.asCurrentUser
    .search(searchparams)
    .then((res) => (response = res))
    .catch((err) => (error = err));
  
  return {
    body: {
      response: response,
      error: error,
    },
  };
}
