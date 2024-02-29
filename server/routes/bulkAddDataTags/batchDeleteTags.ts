import { CoreSetup, KibanaRequest, RequestHandlerContext } from '@kbn/core/server';

export async function batchDeleteTags(
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
  var retVal: any = false;

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

  await (await context.core).elasticsearch.client.asCurrentUser.indices
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

  if (dataTag.index == '*') {
    searchIndex = '*';
  }

  //create parameters
  createParams = {
    index: searchIndex,
    expand_wildcards: 'all',
    refresh: true,
    max_docs: dataTag.batchSize,
    script: {
      source:
        "if (ctx._source.containsKey('analyst_tags')){for(item in params.tag){ if(ctx._source.analyst_tags.contains(item)){ctx._source.analyst_tags.remove(ctx._source.analyst_tags.indexOf(item))}}}",
      lang: 'painless',
      params: {
        tag: dataTag.tags,
      },
    },
    query,
  };

  //update API call
  // console.log('DSL                     DSL');
  // console.log(createParams);
  // console.log(JSON.stringify(createParams));

  await (
    await context.core
  ).elasticsearch.client.asCurrentUser
    .updateByQuery(createParams)
    .then((res: any) => {
      retVal = res;
    })
    .catch((err: any) => {
      returnCode = 505;
      error = err;
    });

  return {
    body: {
      time: new Date().toISOString(),
      res: retVal,
      error: error,
      returnCode: returnCode,
    },
  };
}
