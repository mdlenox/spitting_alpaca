import { CoreSetup, KibanaRequest, RequestHandlerContext } from 'src/core/server';
import { GetDailyFeedResponse, DailyFeedConfig, PanelConfig } from '../../../common/types';
import { AuthenticatedUser } from 'x-pack/plugins/security/public';
import { ResponseError } from '@elastic/elasticsearch/lib/errors';
import { ApiResponse, RequestParams } from '@elastic/elasticsearch';
import { DashboardPanelState } from '@kbn/dashboard-plugin/common';

function extractID(rawPanels: DashboardPanelState[]): PanelConfig {
  var retVal: PanelConfig = {};
  rawPanels.forEach((val) => {
    retVal[val.explicitInput.id] = val;
  });
  return retVal;
}

export async function GetDailyFeed(
  context: RequestHandlerContext,
  request: KibanaRequest,
  core: CoreSetup
) {
  const userauth = { username: 'test' };
  // const userauth: AuthenticatedUser = core.http.auth.get(request).state as AuthenticatedUser;

  var retVal: DailyFeedConfig | undefined;
  var ResVal: ResponseError | ApiResponse | undefined;

  var getparams: RequestParams.Get = {
    id: userauth.username,
    index: 'user-workspace-configs',
  };

  await (
    await context.core
  ).elasticsearch.client.asCurrentUser
    .get(getparams)
    .then((res: any) => {
      ResVal = res;
      (retVal = res.body._source.dailyFeedConfig ? res.body._source.dailyFeedConfig : undefined) &&
      retVal
        ? (retVal.panels = extractID(retVal.panels as DashboardPanelState[]))
        : null;
    })
    .catch((err: any) => (ResVal = err));

  return {
    body: {
      time: new Date().toISOString(),
      dailycfg: retVal,
      elasticResponse: ResVal,
    } as GetDailyFeedResponse,
  };
}
