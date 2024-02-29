import { CoreSetup, KibanaRequest, RequestHandlerContext } from '@kbn/core/server';
import { BulkQuerySearch } from '../../../common/types';
import {
  genBulkQueryLookup,
  getElementCountAndData,
  isNumeric,
  flattenObject,
} from '../../helpers';

export async function bulkQueryLookUp(
  context: RequestHandlerContext,
  request: KibanaRequest,
  core: CoreSetup
) {
  let bulkQuerySearch = request.body as BulkQuerySearch;

  let bulkQuerylookupResponse: any[] = [];

  var msearchparams: any = {
    index: bulkQuerySearch.index,
    body: genBulkQueryLookup(bulkQuerySearch),
  };

  //res.status.meta.body.hasOwnProperty('error')
  //res.status.meta.body.error.caused_by.reason;
  var createerr = { statusCode: 200, errorMessage: '', errorValue: '' };
  (await context.core).elasticsearch.client.asCurrentUser
    .msearch(msearchparams)
    .then((res: any) => {
      // console.log(res);
      if (res.body.responses[0].hasOwnProperty('error')) {
        // console.log('CAUGHT THE ERROR************');
        let errorMessage = '';
        try {
          //attempt to the the error value from the error->rootcause[0] element in the object and if it doesnt exist toast a generic error message
          errorMessage = res.body.responses[0].error.root_cause[0].reason;
          let errorValue = errorMessage.split('[')[1].split(']')[0];
          createerr = { statusCode: 400, errorMessage: errorMessage, errorValue: errorValue };
        } catch {
          //toast a generic error warning
          createerr = {
            statusCode: 400,
            errorMessage:
              'Error in query: unable to parse query contents for ElasticSearch bulk query call',
            errorValue: 'Unkown',
          };
        }
      } else {
        if (!res.body.responses === undefined || !(res.body.responses == 0)) {
          for (let i = 0; i < res.body.responses.length; i++) {
            let docs = res.body.responses[i];

            for (let x = 0; x < docs.hits.hits.length; x++) {
              // ----------------------------------------------
              var doc: any[] = [];
              var preStrippedFlattened = flattenObject(docs.hits.hits[x]);

              for (let key in preStrippedFlattened) {
                let splitKey = key.split('.');
                if (preStrippedFlattened[key] != null) {
                  if (isNumeric(splitKey[splitKey.length - 1])) {
                    //if the end of a key is equal to a number it is part of an array key and must be processed differently
                    if (splitKey[splitKey.length - 1] === '0') {
                      //if it is the first occurence of the array process it else dont process it
                      let parsedDescription = getElementCountAndData(
                        preStrippedFlattened,
                        key,
                        splitKey.slice(0, -1).join('.')
                      );
                      doc.push({
                        [splitKey.slice(0, -1).join('.')]: parsedDescription,
                      });
                      // if (
                      //   columns.findIndex((x) => x.name === splitKey.slice(0, -1).join('.')) === -1
                      // )
                      //   columns.push({
                      //     field: splitKey.slice(0, -1).join('.'),
                      //     name: splitKey.slice(0, -1).join('.'),
                      //     sortable: true,
                      //   });
                    } else {
                      continue;
                    }
                  } else {
                    doc.push({
                      [key]: preStrippedFlattened[key],
                    });
                    // if (columns.findIndex((x) => x.name === key) === -1)
                    //   columns.push({ field: key, name: key, sortable: true });
                  }
                }
              }
              // ----------------------------------------------
              // console.log(doc);
              bulkQuerylookupResponse.push(doc);
            }
          }
        }
      }
    })
    .catch((err) => (createerr = err));

  return {
    body: {
      time: new Date().toISOString(),
      status: createerr,
      bulkQuerylookupResponse: bulkQuerylookupResponse,
    },
  };
}
