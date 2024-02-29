import { CoreSetup, KibanaRequest } from 'kibana/server';

import fetch from 'node-fetch';
import https from 'https';

import { Context } from '@elastic/elasticsearch/lib/Transport';

import { ApiResponse } from '@elastic/elasticsearch';

export async function postConfig(request: KibanaRequest, core: CoreSetup) {
  //Interface for received parameters
  interface ConfigRequest {
    url: string;
    data: string;
  }

  //Declarations
  var configRequest: ConfigRequest = request.body as ConfigRequest;
  var retval: boolean | ApiResponse<Record<string, any>, Context> = false;
  const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
  });

  let status;

  console.log('Data is:');
  console.log(configRequest.data);

  //Build POST request options
  var requestOptions = {
    method: 'POST',
    headers: { Accept: '*/*', 'Content-Type': 'application/json' },
    body: configRequest.data,
    agent: httpsAgent,
  };

  //Execute POST using fetch
  await fetch(configRequest.url, requestOptions)
    .then((response) => {
      status = response.status;
      console.log('Post response is: ');
      console.log(response);
      retval = response;
    })
    .catch((err) => console.log('POST failed: ' + err));

  console.log('POST retval is:');
  console.log(retval);

  return {
    body: {
      response: retval,
      status: status,
    },
  };
}
