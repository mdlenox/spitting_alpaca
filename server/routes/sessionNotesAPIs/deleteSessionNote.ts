import Crypto from 'crypto';
import { CoreSetup, KibanaRequest, RequestHandlerContext } from 'kibana/server';
import { SessionNote } from '../../../common/types';
import { AuthenticatedUser } from 'x-pack/plugins/security/public';
import { SResponseBody, RequestParamsDelete } from '../../helpers';
import { ElasticSearchHit } from 'src/plugins/discover/public/types';
import { RequestParams } from '@elastic/elasticsearch';

export async function handleDeleteSessionNote(
  context: RequestHandlerContext,
  request: KibanaRequest,
  core: CoreSetup
) {
  var userauth: AuthenticatedUser = core.http.auth.get(request).state as AuthenticatedUser;
  const dashboardNoteToDelete: SessionNote = request.body as SessionNote;
  var retval: string = '';
  let code: string = '';

  if (dashboardNoteToDelete.username == userauth.username) {
    // console.log('USERNAME EQUAL EACH OTHER');
    var searchparams: RequestParams.Search = {
      index: 'session-notes',
      body: {
        query: {
          bool: {
            must: [
              { match_phrase: { username: userauth.username } },
              { match_phrase: { timestamp: dashboardNoteToDelete.timestamp } },
              { match_phrase: { 'session.keyword': dashboardNoteToDelete.session } },
            ],
          },
        },
      },
    };

    await context.core.elasticsearch.client.asCurrentUser
      .deleteByQuery(searchparams)
      .then((res) => {
        console.log(res);
        if (res.body.total == 1 && res.body.deleted == 1) {
          retval = 'Session comment deleted successfully';
          code = '200';
          return {
            body: {
              ret: retval,
              code: code,
            },
          };
        } else {
          retval = 'Error: Session comment was not deleted';
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
    retval = 'Error: Session comment was not deleted-Username did not match ';
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

export async function handleDeleteDashboardNotePrev(
  context: RequestHandlerContext,
  request: KibanaRequest,
  core: CoreSetup
) {
  const hasher = Crypto.createHash('sha1');
  const dashboardNoteToDelete: DashboardNote = request.body as DashboardNote;
  const userauth: AuthenticatedUser = core.http.auth.get(request).state as AuthenticatedUser;

  var deleteAllowed = false;
  var retval = false;
  var failreason: undefined | string = 'Failed before anything happened';

  hasher.update(JSON.stringify(dashboardNoteToDelete));
  var dashboardNoteId = hasher.digest('hex');
  if (
    dashboardNoteToDelete.username != null &&
    dashboardNoteToDelete.username == userauth.username
  ) {
    var getParams = {
      id: dashboardNoteId,
      index: 'dashboard-notes',
    };
    await context.core.elasticsearch.client.asCurrentUser.get(getParams).then((res) => {
      if (res.statusCode == 200) {
        console.log('200 Response ');
        deleteAllowed = true;
        failreason = 'passed hash check - failed before deletion';
      } else if (
        userauth.roles.includes('SpittingAlpacaAdmin') ||
        userauth.roles.includes('superuser') //permissions for Deletion!!!!!!!!!!!!
      ) {
        console.log('ELSE IF RESPONSE');
        failreason = 'User is admin - failed before deletion';
        var searchParams = {
          index: 'dashboard-notes',
          query: {
            bool: {
              must: {
                match: {
                  _source: dashboardNoteToDelete,
                },
              },
            },
          },
        };
        context.core.elasticsearch.client.asCurrentUser.search(searchParams).then((res) => {
          var body = res.body as SResponseBody<ElasticSearchHit>;
          if (res.statusCode == 200 && body.hits.total.value > 0) {
            dashboardNoteId = body.hits.hits[0]._id;
            console.log('DASHBOARD ID');
            console.log(dashboardNoteId);
            deleteAllowed = true;
            failreason = 'dashboard note validated - User is admin - failed before deletion';
          } else {
            failreason = 'unable to validate dashboard note - User is admin';
          }
        });
      } else {
        failreason = 'Insufficent permissions';
      }
    });
  } else {
    failreason = 'Invalid dashboard comment to delete';
  }

  if (deleteAllowed) {
    var deleteParams: RequestParamsDelete = {
      index: 'dashboard-notes',
      id: dashboardNoteId,
    };
    await context.core.elasticsearch.client.asCurrentUser.delete(deleteParams).then((res) => {
      if (res.statusCode == 200) retval = true;
      failreason = 'dashboard note deleted successfully';
    });
  }

  return {
    body: {
      success: retval,
      reason: failreason,
    },
  };
}
