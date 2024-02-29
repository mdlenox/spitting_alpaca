import { CoreSetup, KibanaRequest, RequestHandlerContext } from 'kibana/server';
import { ApiResponse } from '@elastic/elasticsearch';
import { Context } from '@elastic/elasticsearch/lib/Transport';
import { processResult } from 'immer/dist/internal';

export async function bulkUpdateDocs(
  context: RequestHandlerContext,
  request: KibanaRequest,
  core: CoreSetup
) {
  interface BulkUpdate {
    tag: string;
    queryJson: string;
    queryIndex: string;
  }

  const params: BulkUpdate = request.body as BulkUpdate;
  var retVal: boolean | ApiResponse<Record<string, any>, Context> = false;

  var status: any = [];
  let error: any = {};
  let returnCode: number = 200;

  var createParams: any;

  let parsedQueryIndex = params.queryIndex.replaceAll('\\', '');

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
            console.log(element.name);
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

  let jsonQueryObject = JSON.parse(params.queryJson);

  let searchIndex = arrayOfIndexes.length != 0 ? arrayOfIndexes : parsedQueryIndex;

  //create parameters
  createParams = {
    index: searchIndex,
    expand_wildcards: 'all',
    slices: 'auto',
    conflicts: 'proceed',
    refresh: true,

    script: {
      source:
        "if (ctx._source.containsKey('analyst_tags')){for(item in params.tag){ if(!ctx._source.analyst_tags.contains(item)){ctx._source.analyst_tags.add(item)}}}else{ctx._source.analyst_tags = params.tag}",
      lang: 'painless',
      params: {
        tag: params.tag,
      },
    },
    query: jsonQueryObject,
  };

  //update API call

  await context.core.elasticsearch.client.asCurrentUser
    .updateByQuery(createParams)
    .then((res: any) => {
      status = res;
    })
    .catch((err) => {
      returnCode = 505;
      error = err;
    });

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
