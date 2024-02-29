import { CoreSetup, KibanaRequest, RequestHandlerContext } from 'kibana/server';
import { ApiResponse } from '@elastic/elasticsearch';
import { Context } from '@elastic/elasticsearch/lib/Transport';

export async function addTag(
  context: RequestHandlerContext,
  request: KibanaRequest,
  core: CoreSetup
) {
  const tag = request.body;

  var updateRetVal: boolean | ApiResponse<Record<string, any>, Context> = false;

  var updateParams = {
    id: tag.id,
    index: tag.index,
    refresh: true,
    script: {
      source:
        "if (ctx._source.containsKey('analyst_tags')){for(item in params.tag){if (!ctx._source.analyst_tags.contains(item)) {ctx._source.analyst_tags.add(item)}}}else{ctx._source.analyst_tags = params.tag}",
      lang: 'painless',
      params: {
        tag: tag.tag,
      },
    },
  };

  //"if (ctx._source.containsKey('tags')){for(item in params.tag){ctx._source.tags.add(item)}}else{ctx._source.tags = params.tag}",

  var createerr = { statusCode: 200 };

  console.log(updateParams);

  await context.core.elasticsearch.client.asCurrentUser
    .update(updateParams)
    .then((res) => {
      updateRetVal = res;
    })
    .catch((err) => {
      createerr = err;
    });

  return {
    body: {
      time: new Date().toISOString(),
      successful: updateRetVal,
      status: createerr,
    },
  };
}
