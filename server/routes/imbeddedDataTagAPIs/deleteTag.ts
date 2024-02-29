import Crypto from 'crypto';
import { CoreSetup, KibanaRequest, RequestHandlerContext } from 'kibana/server';
import { AnalystTag } from '../../../common/types';
import { AuthenticatedUser } from 'x-pack/plugins/security/public';
import { SResponseBody } from '../../helpers';
import { ElasticSearchHit } from 'src/plugins/discover/public/application/doc_views/doc_views_types';
import { RequestParams } from '@elastic/elasticsearch';
import { ApiResponse } from '@elastic/elasticsearch';
import { Context } from '@elastic/elasticsearch/lib/Transport';

export async function deleteTagFromDoc(
  context: RequestHandlerContext,
  request: KibanaRequest,
  core: CoreSetup
) {
  const hasher = Crypto.createHash('sha1');
  const tag = request.body;
  const userauth: AuthenticatedUser = core.http.auth.get(request).state as AuthenticatedUser;
  var retVal: boolean | ApiResponse<Record<string, any>, Context> = false;
  var updateRetVal: boolean | ApiResponse<Record<string, any>, Context> = false;
  hasher.update(JSON.stringify(tag));

  var updateParams = {
    id: tag.id,
    index: tag.index,
    refresh: true,
    script: {
      source:
        'for(item in params.tag){if (ctx._source.analyst_tags.contains(item)) { ctx._source.analyst_tags.remove(ctx._source.analyst_tags.indexOf(item)) }}',
      lang: 'painless',
      params: {
        tag: tag.tag,
      },
    },
  };

  var createerr = { statusCode: 200 };

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

export async function deleteDataTag(
  context: RequestHandlerContext,
  request: KibanaRequest,
  core: CoreSetup
) {
  var userauth: AuthenticatedUser = core.http.auth.get(request).state as AuthenticatedUser;
  const tag: AnalystTag = request.body as AnalystTag;
  var retval: string = '';
  let code: string = '';

  if (tag.username == userauth.username) {
    var searchparams: RequestParams.Search = {
      index: 'data-tags',
      body: {
        query: {
          bool: {
            must: [
              { match_phrase: { username: userauth.username } },
              { match_phrase: { 'tag.keyword': tag.tag } },
            ],
          },
        },
      },
    };

    await context.core.elasticsearch.client.asCurrentUser
      .deleteByQuery(searchparams)
      .then((res) => {
        if (res.body.total == 1 && res.body.deleted == 1) {
          retval = 'Data tag deleted successfully';
          code = '200';
          return {
            body: {
              ret: retval,
              code: code,
            },
          };
        } else {
          retval = 'Error: Data tag was not deleted';
          code = '400';
          return {
            body: {
              ret: retval,
              code: code,
            },
          };
        }
      });
  } else {
    retval = 'Error: Data tag was not deleted-Username did not match ';
    code = '400';
    return {
      body: {
        ret: retval,
        code: code,
      },
    };
  }
  return {
    body: {
      time: new Date().toISOString(),
      ret: retval,
      code: code,
    },
  };
}

export async function handleDeleteTag(
  context: RequestHandlerContext,
  request: KibanaRequest,
  core: CoreSetup
) {
  const hasher = Crypto.createHash('sha1');
  const tagToDelete: AnalystTag = request.body as AnalystTag;
  const userauth: AuthenticatedUser = core.http.auth.get(request).state as AuthenticatedUser;

  var deleteAllowed = false;
  var retval = false;
  var failreason: undefined | string = 'Failed before anything happened';

  hasher.update(JSON.stringify(tagToDelete));
  var tagid = hasher.digest('hex');
  if (tagToDelete.username != null) {
    var getParams = {
      id: tagid,
      index: 'data-tags',
    };
    await context.core.elasticsearch.client.asCurrentUser.get(getParams).then((res) => {
      if (res.statusCode == 200) {
        deleteAllowed = true;
        failreason = 'passed hash check - failed before deletion';
      } else if (
        userauth.roles.includes('SpittingAlpacaAdmin') ||
        userauth.roles.includes('superuser')
      ) {
        failreason = 'User is admin - failed before deletion';
        var searchParams = {
          index: 'data-tags',
          query: {
            bool: {
              must: {
                match: {
                  _source: tagToDelete,
                },
              },
            },
          },
        };
        context.core.elasticsearch.client.asCurrentUser.search(searchParams).then((res) => {
          var body = res.body as SResponseBody<ElasticSearchHit>;
          if (res.statusCode == 200 && body.hits.total.value > 0) {
            tagid = body.hits.hits[0]._id;
            deleteAllowed = true;
            failreason = 'tag validated - User is admin - failed before deletion';
          } else {
            failreason = 'unable to validate tag - User is admin';
          }
        });
      } else {
        failreason = 'Insufficent permissions';
      }
    });
  }

  if (deleteAllowed) {
    var deleteParams: RequestParams.Delete = {
      index: 'data-tags',
      id: tagid,
    };
    await context.core.elasticsearch.client.asCurrentUser.delete(deleteParams).then((res) => {
      if (res.statusCode == 200) retval = true;
      failreason = 'tag deleted successfully';
    });
  }

  return {
    body: {
      success: retval,
      reason: failreason,
    },
  };
}
