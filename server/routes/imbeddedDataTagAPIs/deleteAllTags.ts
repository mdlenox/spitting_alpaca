import { CoreSetup, KibanaRequest, RequestHandlerContext } from 'kibana/server';
import { AuthenticatedUser } from 'x-pack/plugins/security/public';
import { ApiResponse, TransportRequestOptions } from '@elastic/elasticsearch';
import { Context } from '@elastic/elasticsearch/lib/Transport';

export async function deleteAllTags(
  context: RequestHandlerContext,
  request: KibanaRequest,
  core: CoreSetup
) {
  interface Tag {
    tag: string;
    owner: string;
    deleteOption: number;
  }

  const dataTag: Tag = request.body as Tag;
  const userauth: AuthenticatedUser = core.http.auth.get(request).state as AuthenticatedUser;
  var retVal: boolean | ApiResponse<Record<string, any>, Context> = false;

  var status: any = [];
  let error: any = {};
  let returnCode: number = 200;

  if (dataTag.owner === userauth.username) {
    //if the usernames match

    var createParams: any;

    //create parameters
    createParams = {
      index: '*',
      expand_wildcards: 'all',
      scroll_size: 500,
      script: {
        source:
          'if (ctx._source.analyst_tags.contains(params.tag)) { ctx._source.analyst_tags.remove(ctx._source.analyst_tags.indexOf(params.tag)) }',
        lang: 'painless',
        params: {
          tag: dataTag.tag,
        },
      },
      query: {
        match_phrase: {
          'analyst_tags.keyword': dataTag.tag,
        },
      },
    };

    //update API call

    await context.core.elasticsearch.client.asCurrentUser
      .updateByQuery(createParams)
      .then((res: any) => {
        status.push({ index: { status: 200, res: res } });
      })
      .catch((err) => {
        returnCode = 505;
        error = err;
      });

    if (returnCode != 505) {
      //if the delete by query didnt throw an error procced to deleting the tag from the data-tags index

      //delete the data tag from the data tag index
      if (dataTag.deleteOption == 1) {
        //1 means to delete the tag
        var createDeleteTagParams = {
          index: 'data-tags',
          refresh: true,
          query: {
            match_phrase: {
              'tag.keyword': dataTag.tag,
            },
          },
        };

        await context.core.elasticsearch.client.asCurrentUser
          .deleteByQuery(createDeleteTagParams)
          .then((res: any) => {
            status.push({ delete: { status: 200, res: res } });
          })
          .catch((err) => {
            returnCode = 501;
            error = err;
            return {
              body: {
                time: new Date().toISOString(),
                returnCode: returnCode,
                res: retVal,
                status: status,
                error: error,
              },
            };
          });
      }
    }
  } else {
    //the usernames didnt match
    returnCode = 502;
  }

  return {
    body: {
      time: new Date().toISOString(),
      res: retVal,
      status: status,
      error: error,
      returnCode: returnCode,
    },
  };
}
