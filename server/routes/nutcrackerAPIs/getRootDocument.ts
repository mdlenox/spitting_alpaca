import { RequestParams } from '@elastic/elasticsearch';
import { CoreSetup, KibanaRequest, RequestHandlerContext } from 'kibana/server';

export async function getRootDocument(
  context: RequestHandlerContext,
  request: KibanaRequest,
  core: CoreSetup
) {
  var { id } = request.body as { id: string };
  var { index } = request.body as { index: string };
  var searchparams: RequestParams.Search = {
    index: index,
    size: 10,
    body: {
      query: {
        match_phrase: { 'log.id.fuid': id },
      },
    },
  };

  let response;
  let error;
  let checkStatus = 100;
  await context.core.elasticsearch.client.asCurrentUser
    .search(searchparams)
    .then(async (res: any) => {
      console.log(res);
      if (res?.body?.hits?.total?.value != undefined && res?.body?.hits?.total?.value > 0) {
        console.log('proper document count');
        response = res;
        checkStatus = 200;
      } else if (res?.body?.hits?.total?.value == 0) {
        checkStatus = 403;
        error = 'User does not have permissions to view the document';
      } else {
        //the Document count was off
        checkStatus = 402;
        error = 'Search returned incorrect number of documents from root index';
      }
    })
    .catch((err) => {
      error = err?.meta?.body?.error?.reason;
    });

  //check to see if the status is correct so we can continue with the operation
  if (checkStatus == 200) {
    //Create search and retrieve the nutcracker results
    var nutcrackerSearchParams: RequestParams.Search = {
      index: 'nutcracker',
      size: 10,
      body: {
        query: {
          match_phrase: { id: id },
        },
      },
    };

    //make the API call
    await context.core.elasticsearch.client.asCurrentUser
      .search(nutcrackerSearchParams)
      .then(async (res: any) => {
        //check to see if we get back a nutcracker result and only one is returned
        if (res?.body?.hits?.total?.value != undefined && res?.body?.hits?.total?.value == 1) {
          //if the count was correct return the results in the response field
          response = res;
          checkStatus = 200;
        } else {
          //the Document count was off
          checkStatus = 403;
          error = 'Search returned incorrect number of documents from nutcracker results index';
        }
      })
      .catch((err) => {
        error = err?.meta?.body?.error?.reason;
        checkStatus = 405;
      });
  }

  return {
    body: {
      response: response,
      status: checkStatus,
      error: error,
    },
  };
}
