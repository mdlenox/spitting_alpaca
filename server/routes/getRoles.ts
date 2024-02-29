import { CoreSetup, KibanaRequest } from 'kibana/server';
import { AuthenticatedUser } from 'x-pack/plugins/security/public';

export function getRoles(request: KibanaRequest, core: CoreSetup) {
  var userauth: AuthenticatedUser = core.http.auth.get(request).state as AuthenticatedUser;

  var retval = userauth.roles;

  return {
    body: {
      time: new Date().toString(),
      roles: retval,
    },
  };
}
