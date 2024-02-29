import {
  TimeRange,
  Query,
  RefreshInterval,
  IpAddress,
  DataView,
} from '../../../src/plugins/data/common';
import { Filter } from '@kbn/es-query';
import { DashboardPanelState } from '../../../src/plugins/dashboard/common';
import { ResponseError } from '@elastic/transport/lib/errors';

export interface DataTagHit {
  _id: string;
  _index: string;
  _score: number;
  _source: {
    details: string;
    owner: string;
    tag: string;
    timestamp: string;
    users: string[];
  };
}

export interface DataTag {
  id: number;
  tag: string;
  details: string;
  owner: string;
  users: string[];
  timestamp: string;
  _id: string;
}

/* dashboard notes interface
used to create the actual dashboard notes.
*/

export interface bulkAddCountObject {
  queryJson: string;
  queryIndex: string;
}
export interface ImbeddedDataTag {
  tag: string;
  details: string;
  users: string[];
  owner: string;
  timestamp: string;
}

export interface DataTagUpdate {
  updateID: string;
  tag: string;
  details: string;
  owner: string;
  users: string[];
  timestamp: string;
}

export interface IOCList {
  username: string;
  listName: string;
}

export interface DashboardNote {
  username: string;
  timestamp: string;
  dashboardId: string;
  note: string;
  event: string;
  id: string;
  dateAdded: string;
}

export interface IOCListUpdate {
  username: string;
  IOCList: string;
  listName: string;
  creationDate: string;
  updateDate: string;
  hasUpdated: boolean;
  id: string;
  description: string;
  additionalUsers: string[];
}

export interface IOCListIDLookup {
  listName: string;
  creationDate: string;
}

export interface IOCList {
  username: string;
  IOCList: string;
  listName: string;
  creationDate: string;
  updateDate: string;
  hasUpdated: boolean;
  additionalUsers: string[];
  description: string;
  listSource: string;
}

//this list contains an id for displaying the IOC List in Eui componenets
export interface DisplayIOCList {
  listName: string;
  id: number;
  list: any;
  creationDate: string;
  username: string;
  updateDate: string;
  hasUpdated: boolean;
  elasticID: string;
  additionalUsers: string[];
  description: string;
  listSource: string;
}

export interface SessionNote {
  username: string;
  timestamp: string;
  session: string;
  note: string;
  event: string;
  id: string;
  dateAdded: string;
}

export interface GetDashboardNoteByQuery {
  dashboardId: string;
}

export interface AnalystNote {
  index: string;
  username: string;
  timestamp: string;
  originalId: string;
  fieldname: string;
  fieldval: string;
  note: string;
  applytoall: boolean;
}

export interface DashboardTimeLookup {
  dashid: String;
}

export interface AnalystTag {
  username: string;
  rawtime?: number;
  timestamp: string;
  originalIndex: string;
  originalId: string;
  fieldname: string;
  fieldval: string;
  tag: string;
  applytoall: boolean;
}

export interface BulkQuerySearch {
  index: string;
  field: string;
  size: number;
  bulkQueryValue: string[];
  filters: {
    filterField: string;
    filterOperator: string;
    filterTextValue: string;
  }[];
}

export interface ATagWithHits extends AnalystTag {
  hits: any[];
}

export interface GetDashboardFavoritesTimeOptions {
  username: string;
  dashid: string;
}

export interface FavoritedDash {
  user: string;
  dashid: string;
  showquery: boolean;
  showtime: boolean;
  showfilter: boolean;
  filters?: Filter[];
  time?: TimeRange;
  query?: Query | { query: string; language: 'lucene' };
  refreshInterval: RefreshInterval;
}

export interface DashboardParams {
  indexes?: string[];
  filters?: Filter[];
  time: TimeRange;
  query?: Query;
  refreshInterval: RefreshInterval;
}

export interface PanelConfig {
  [key: string]: DashboardPanelState;
}

export interface SessionMeta {
  _id: string;
  network: {
    community_id: string;
    sourceip: IpAddress;
    sourceport: number;
    destip: IpAddress;
    destport: number;
  };
  zeeks_output_id?: string[];
  suricata_output_ids?: string[];
  decoder_ids?: { [key: string]: string };
  SessionNotes?: { [key: string]: any };
}

export interface DailyFeedConfig {
  panels: PanelConfig | DashboardPanelState[];
  preferences?: any;
}

export interface GetTagsByHitRequest {
  hit: any;
  flattenedhit: Record<string, any>;
}

export interface GetTagsByDocRequest {
  hit: any;
  index: DataView;
  flattenedhit: Record<string, any>;
}

export interface GetTagsByQueryRequest {
  indices: string[];
  dashparams: DashboardParams;
}

export interface postUrl {
  url: string;
}

export interface GetTagsByQueryResult {
  [key: string]: {
    tag: AnalystTag;
    hitIDs: string[];
    took: number;
    totalhits: {
      relation: string;
      value: number;
    };
  };
}

export interface GetDailyFeedResponse {
  dailycfg?: DailyFeedConfig;
  time: string;
  elasticResponse: ResponseError | any;
}

export const InvalidMetaFields = [
  '_id',
  '_index',
  '_score',
  '_type',
  '@timestamp',
  '@version',
  'Arkime-Pivot (COMMUNITY-ID)',
  'Arkime-Pivot (FILENAME)',
  'Arkime-Pivot (IP and PORT)',
  'Arkime Decoder Filename Pivot',
  'Suricata Arkime Filename Pivot',
  'Zeek Arkime Filename Pivot',
  'Arkime CommunityId Pivot',
  'Arkime PCAP Filename Pivot',
  'Arkime Pivot (Community ID)',
  'Decoder Community_ID Arkime Pivot',
  'Decoder IP and Port Pivot',
  'ECS Arkime Community ID pivot',
  'ECS Arkime Filename Pivot',
  'XPANSE Destination IP Pivot',
  'XPANSE Source IP Pivot',
  'network.community_id',
  'client.geo.location',
  'destination.geo.location',
  'host.geo.location',
  'observer.geo.location',
  'server.geo.location',
  'source.geo.location',
  '@meta.geoip_orig.location',
  '@meta.geoip_resp.location',
  'client.geo.location',
  'destination.geo.location',
  'geoip_dest.location',
  'geoip_src.location',
  'related.geo',
  'server.geo.location',
  'source.geo.location',
];

export interface GeoPoint {
  lat: number;
  lon: number;
}

export function isGeoPoint(value: any): value is GeoPoint {
  // let objString = JSON.stringify(value);

  // if (objString.includes(',"type":"Point"')) {
  //   let arrayOfValues: number[] = value.coordinates;
  //   console.log(arrayOfValues);
  //   console.log(value.coordinates);
  //   // console.log(value.cooridantes[1]);
  //   console.log(typeof arrayOfValues);
  //   console.log(arrayOfValues[1]);
  //   return false;
  // }
  // return false;

  return 'lat' in value;
}

/*
    curl -X GET -k -u elastic:DXb7t4U82Rl9Oxb6q7q49Qq2 "https://kelasticsearch.moondragon.lan/data-sets/_msearch?pretty" -H 'Content-Type: application/json' -d'
{}
{
  "query": { 
    "bool": { 
      "must": [
        {"match":{"fieldval":"1:qljzCLklPIXH9+PnkElhlsDs0v4="}}
      ]
    }
  }
}
'
*/
