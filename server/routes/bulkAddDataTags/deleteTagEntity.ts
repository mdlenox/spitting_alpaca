import { CoreSetup, KibanaRequest, RequestHandlerContext } from 'src/core/server';

export async function deleteTagEntity(
  context: RequestHandlerContext,
  request: KibanaRequest,
  core: CoreSetup
) {
  interface Tag {
    tag: string;
    owner: string;
  }

  const dataTag: Tag = request.body as Tag;
  var retVal: any = false;

  let error: any = {};
  let returnCode: number = 200;

  var createDeleteTagParams = {
    index: 'data-tags',
    refresh: true,
    query: {
      match_phrase: {
        'tag.keyword': dataTag.tag,
      },
    },
  };

  await (
    await context.core
  ).elasticsearch.client.asCurrentUser
    .deleteByQuery(createDeleteTagParams)
    .then((res: any) => {
      retVal = res;
    })
    .catch((err: any) => {
      returnCode = 501;
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
