import Crypto from 'crypto';
import { CoreSetup, KibanaRequest, RequestHandlerContext } from 'src/core/server';

export interface ImbeddedDataTag {
  username: string;
  tag: string;
  details: string;
  users: string[];
  owner: string;
  timestamp: string;
}

export async function createTag(
  context: RequestHandlerContext,
  request: KibanaRequest,
  core: CoreSetup
) {
  const tag = request.body as ImbeddedDataTag;

  var retVal: any = false;
  var updateRetVal: any = false;
  const hasher = Crypto.createHash('sha1');
  let timestamp = await new Date().toISOString();

  hasher.update(JSON.stringify(tag));
  var createParams = {
    id: hasher.digest('hex'),
    index: 'data-tags',
    refresh: true,
    body: {
      tag: tag.tag,
      details: tag.details,
      owner: tag.username,
      users: tag.users,
      timestamp: timestamp,
    },
  };

  var createerr = { statusCode: 200 };

  await (
    await context.core
  ).elasticsearch.client.asCurrentUser
    .create(createParams)
    .then((res) => {
      updateRetVal = res;
    })
    .catch((err) => {
      createerr = err;
    });

  return {
    body: {
      time: new Date().toISOString(),
      successful: retVal,
      status: createerr,
    },
  };
}
