import Crypto from 'crypto';
import { CoreSetup, KibanaRequest, RequestHandlerContext } from 'kibana/server';
import { SessionNote } from '../../../common/types';
import { AuthenticatedUser } from 'x-pack/plugins/security/public';
import { ApiResponse } from '@elastic/elasticsearch';
import { Context } from '@elastic/elasticsearch/lib/Transport';

export async function handleNewSessionNote(
  context: RequestHandlerContext,
  request: KibanaRequest,
  core: CoreSetup
) {
  const hasher = Crypto.createHash('sha1');
  const newDashboardNote: SessionNote = request.body as SessionNote; //have to create the dashboard note class in common types
  const userauth: AuthenticatedUser = core.http.auth.get(request).state as AuthenticatedUser;
  var retVal: boolean | ApiResponse<Record<string, any>, Context> = false;

  if (newDashboardNote.username != null) {
    hasher.update(JSON.stringify(newDashboardNote));
    var createParams = {
      id: hasher.digest('hex'),
      index: 'session-notes',
      body: {
        username: userauth.username,
        //rawtime: Date.parse(newDashboardNote.timestamp.replace('Zulu', 'GMT')),
        timestamp: newDashboardNote.timestamp,
        session: newDashboardNote.session,
        note: newDashboardNote.note,
        event: newDashboardNote.event,
        dateAdded: newDashboardNote.dateAdded,
      },
    };

    var statusErr = { statusCode: 200 };
    await context.core.elasticsearch.client.asCurrentUser
      .create(createParams)
      .then((res) => (retVal = res))
      .catch((err) => {
        statusErr = err;
      });

    return {
      body: {
        time: new Date().toISOString(),
        successful: retVal,
        status: statusErr,
      },
    };
  }
}
