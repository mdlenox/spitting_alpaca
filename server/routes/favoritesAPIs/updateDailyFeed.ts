import { ApiResponse, RequestParams } from '@elastic/elasticsearch';
import { CoreSetup, KibanaRequest, RequestHandlerContext } from 'kibana/server';
import { DailyFeedConfig, PanelConfig } from '../../../common/types';
import { AuthenticatedUser } from 'x-pack/plugins/security/public';
import { Context } from '@elastic/elasticsearch/lib/Transport';
import { DashboardPanelState } from 'src/plugins/dashboard/public/application';

export async function handleDailyFeedUpdate(
  context: RequestHandlerContext,
  request: KibanaRequest,
  core: CoreSetup
) {
  var updateParams: RequestParams.Update;
  var createerr = { statusCode: 200 };
  var retVal: boolean | ApiResponse<Record<string, any>, Context> = false;
  const userauth: AuthenticatedUser = core.http.auth.get(request).state as AuthenticatedUser;
  if (request.body) {
    var newcfg: DailyFeedConfig = request.body as DailyFeedConfig;
    var panels: DashboardPanelState[] = [];
    var temp: PanelConfig = newcfg.panels as PanelConfig;
    for (let x in temp) {
      panels.push({ ...temp[x] });
    }
    newcfg.panels = panels;
    updateParams = {
      id: userauth.username,
      index: 'user-workspace-configs',
      body:
        Object.keys(newcfg.panels).length != 0
          ? {
              script: {
                source: 'ctx._source.dailyFeedConfig.panels=params.panels',
                lang: 'painless',
                params: {
                  panels: newcfg.panels,
                },
              },
              upsert: {
                dailyFeedConfig: newcfg,
              },
            }
          : {
              script: 'ctx._source.dailyFeedConfig.remove("panels")',
            },
    };
    await context.core.elasticsearch.client.asCurrentUser
      .update(updateParams)
      .then((res) => (retVal = res))
      .catch((err) => {
        createerr = err;
      });
  }
  return {
    body: {
      time: new Date().toISOString(),
      successful: retVal,
      status: createerr,
      updateParams: updateParams!,
    },
  };
}
