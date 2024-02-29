import { CoreSetup, KibanaRequest } from 'kibana/server';

import fetch from 'node-fetch';
import https from 'https';

import { Context } from '@elastic/elasticsearch/lib/Transport';

import { ApiResponse } from '@elastic/elasticsearch';

export async function getConfig(request: KibanaRequest, core: CoreSetup) {
  interface ConfigRequest {
    url: string;
  }
  var configRequest: ConfigRequest = request.body as ConfigRequest;

  var retval: boolean | ApiResponse<Record<string, any>, Context> = false;

  const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
  });

  let status = false;
  let error = false;

  // fetch(configRequest.url, {
  //   method: 'GET',
  //   headers: { Accept: '*/*' },

  //   agent: httpsAgent,
  // })
  //   .then((res: any) => {
  //     console.log('res is:');
  //     console.log(res);
  //     retval = res;
  //   })
  //   .catch((err) => console.log('fetch failed: ' + err));

  await fetch(configRequest.url, {
    method: 'GET',
    headers: { Accept: '*/*' },

    agent: httpsAgent,
  })
    .then((response) => {
      status = response.status;
      return response.json();
    })
    .then((data) => {
      retval = data;
      console.log('data is:');
      console.log(data);
    })
    .catch((err) => {
      console.log('fetch failed: ' + err);
      error = err;
    });

  console.log('retval is:');
  console.log(retval);

  return {
    body: {
      config: retval,
      status: status,
      error: error,
    },
  };
}
