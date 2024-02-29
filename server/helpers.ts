import { AnalystTag, BulkQuerySearch } from '../common/types';

export type TRequestBody = Record<string, any>[];

export interface Pit {
  id: string;
  keep_alive: string;
}

export interface RequestParamsDelete {
  id: string;
  index: string;
}

export interface SResponseBody<T = unknown> {
  hits: {
    hits: any;
    total: {
      value: number;
      relation: string;
    };
  };
  status: number;
}

export interface STagResponse<T = unknown> {
  body: SResponseBody<T>;
}

export interface MSTagResponse {
  body: {
    responses: {
      [key: string]: SResponseBody<AnalystTag>;
    };
  };
}
export interface MSQueryResponse {
  body: {
    b: TRequestBody;
    responses?: {
      [key: string]: {
        hits: {
          hits: any;
          total: {
            value: number;
            relation: string;
          };
        };
        status: number;
      };
    };
  };
}
export interface getTagsReturn {
  hits: { [key: string]: any };
  totalfails: number;
  errors: {
    error: any;
  }[];
}

export function genBulkQueryLookup(filters: BulkQuerySearch) {
  let retval: TRequestBody = [];
  let field = filters.field;
  let must_not: any[] = [];
  let filter: any[] = [];
  let size: number = filters.size;
  //filter.push({ match: { 'destination.ip_version': 4 } });
  // filter.push({ match: { '@version': 1 } });

  //if there are no filters
  if (filters.filters.length == 0) {
    for (let value in filters.bulkQueryValue) {
      retval.push({ index: filters.index });
      retval.push({
        size: size,
        query: {
          bool: {
            must: [{ match_phrase: { [field]: filters.bulkQueryValue[value] } }],
          },
        },
      });
    }
  } else {
    //creat the must, the first field and value needs to be the bulk query value

    filters.filters.forEach((f) => {
      let field =
        f.filterField.includes('.keyword') || f.filterField === '@timestamp'
          ? f.filterField
          : f.filterField + '.keyword';

      if (f.filterOperator == '1') {
        //must
        filter.push({ term: { [field]: f.filterTextValue } });
      } else if (f.filterOperator == '0') {
        //must_not
        must_not.push({ match_phrase: { [f.filterField]: f.filterTextValue } });
      }
    });

    for (let value in filters.bulkQueryValue) {
      retval.push({ index: filters.index });
      retval.push({
        size: size,
        query: {
          bool: {
            must: [{ match_phrase: { [field]: filters.bulkQueryValue[value] } }],
            must_not,
            filter,
          },
        },
      });
    }
  }

  return retval;
}

export function getElementCountAndDataAsString(flattened: any, splitKey: string) {
  let description: string[] = [];
  let t = [];
  for (let element in flattened) {
    let parsedValue = element.split('.');
    if (parsedValue.slice(0, -1).join('.') === splitKey) {
      // console.log('The field value: ' + element);
      // console.log(parsedValue.slice(0, -1).join('.') + '::::' + splitKey);
      description.push('"' + flattened[element] + '"');
      t.push(flattened[element]);
    }
  }
  let retval = '[' + description.toString() + ']';
  // console.log('Description: ' + description);
  //["a", "b"]
  return retval;
}

export function flattenObject(obj: any, parent = '') {
  const flattened: { [key: string]: any } = {};
  parent = parent == '_source' ? '' : parent;
  Object.keys(obj).forEach((key) => {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      Object.assign(flattened, flattenObject(obj[key], parent != '' ? parent + '.' + key : key));
    } else {
      flattened[parent != '' ? parent + '.' + key : key] = obj[key];
    }
  });
  // console.log(flattened);
  return flattened;
}

export function getElementCountAndData(flattened: any, key: string, splitKey: string) {
  let description: string[] = [];
  let t = [];
  for (let element in flattened) {
    let parsedValue = element.split('.');
    if (parsedValue.slice(0, -1).join('.') === splitKey) {
      // console.log('The field value: ' + element);
      // console.log(parsedValue.slice(0, -1).join('.') + '::::' + splitKey);
      description.push('"' + flattened[element] + '"');
      t.push(flattened[element]);
    }
  }
  // console.log('Description: ' + description);
  //["a", "b"]
  return t;
}

export function isNumeric(str: any) {
  if (typeof str != 'string') return false; // we only process strings!
  return (
    !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
    !isNaN(parseFloat(str))
  ); // ...and ensure strings of whitespace fail
}
