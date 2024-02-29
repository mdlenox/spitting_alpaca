import { CoreSetup, KibanaRequest, RequestHandlerContext } from 'kibana/server';
import { AuthenticatedUser } from 'x-pack/plugins/security/public';
import { ApiResponse, TransportRequestOptions } from '@elastic/elasticsearch';
import { Context } from '@elastic/elasticsearch/lib/Transport';

export async function batchUpdateTags(
  context: RequestHandlerContext,
  request: KibanaRequest,
  core: CoreSetup
) {
  interface Tag {
    tags: string[];
    query: string;
    index: string;
    batchSize: number;
  }

  const dataTag: Tag = request.body as Tag;
  var retVal: boolean | ApiResponse<Record<string, any>, Context> = false;

  let error: any = {};
  let returnCode: number = 200;

  let query: any = JSON.parse(dataTag.query);

  let parsedQueryIndex = dataTag.index.replaceAll('"', '');

  //if the usernames match

  var createParams: any;

  let resolveIndex = {
    name: parsedQueryIndex,
  };

  let arrayOfIndexes: string[] = [];

  await context.core.elasticsearch.client.asCurrentUser.indices
    .resolveIndex(resolveIndex)
    .then((res: any) => {
      console.log(res);
      try {
        let dataStreamsArray = res.body.data_streams;
        if (dataStreamsArray.length != 0) {
          dataStreamsArray.forEach((element: any) => {
            arrayOfIndexes.push(element.name);
          });
        }
      } catch (err) {
        status = res;
        return {
          body: {
            time: new Date().toISOString(),
            res: retVal,
            status: status,
            error: error,
            returnCode: 501,
          },
        };
      }
    });

  let searchIndex = arrayOfIndexes.length != 0 ? arrayOfIndexes : parsedQueryIndex;

  //create parameters
  createParams = {
    index: searchIndex,
    expand_wildcards: 'all',
    refresh: true,
    max_docs: dataTag.batchSize,
    script: {
      source:
        "if (ctx._source.containsKey('analyst_tags')){for(item in params.tag){ if(!ctx._source.analyst_tags.contains(item)){ctx._source.analyst_tags.add(item)}}}else{ctx._source.analyst_tags = params.tag}",
      lang: 'painless',
      params: {
        tag: dataTag.tags,
      },
    },
    query,
  };

  console.log(createParams);
  console.log(JSON.stringify(createParams));

  await context.core.elasticsearch.client.asCurrentUser
    .updateByQuery(createParams)
    .then((res: any) => {
      retVal = res;
    })
    .catch((err) => {
      returnCode = 505;
      error = err;
    });

  return {
    body: {
      time: new Date().toISOString(),
      res: retVal,
      error: error,
      returnCode: returnCode,
      resolvedNames: searchIndex,
    },
  };
}
