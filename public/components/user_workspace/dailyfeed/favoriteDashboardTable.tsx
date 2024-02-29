import React, { useEffect, useState } from 'react';
import {
  EuiBasicTable,
  EuiBasicTableColumn,
  Criteria,
  EuiEmptyPrompt,
  EuiLoadingLogo,
} from '@elastic/eui';
import { getCurrentUser, getCore } from './../../../services';

interface Dashboard {
  id: number;
  dashid: string;
  title: string;
  user: string;
}

//wasnt needed but may be needed later
// interface DashboardHit {
//   _id: string;
//   _index: string;
//   _score: number;
//   _source: {
//     dashid: string;
//     refreshInterval: {
//       pause: boolean;
//       value: number;
//     };
//     showfilter: boolean;
//     showquery: boolean;
//     showtime: boolean;
//     username: string;
//   };
// }

interface SavedDashboard {
  description: string;
  hits: number;
  kibanaSavedObjectMeta: {};
  optionsJSON: string;
  panelsJSON: string;
  refreshInterval: { pause: boolean; value: number };
  timeFrom: string;
  timeRestore: boolean;
  timeTo: string;
  title: string;
  version: number;
}

export default () => {
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [tableState, setTableState] = useState<string>('Loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [dashboardsList, setDashboardsList] = useState<Dashboard[]>([]);

  const columns: Array<EuiBasicTableColumn<Dashboard>> = [
    {
      field: 'title',
      name: 'Dashboard Title',
      sortable: true,
      truncateText: true,
      mobileOptions: {
        render: (dashboard: Dashboard) => <span>{dashboard.title}</span>,
        header: false,
        truncateText: false,
        enlarge: true,
        width: '100%',
      },
    },
    {
      name: 'Actions',
      actions: [
        {
          name: 'link',
          description: 'Navigate to Dashboard',
          type: 'icon',
          icon: 'globe',
          onClick: (dashboard: Dashboard) => {
            navigateToDashboard(dashboard);
          },
        },
        {
          name: 'Delete',
          description: 'Delete this Dashboard',
          icon: 'trash',
          type: 'icon',
          color: 'danger',
          onClick: (dashboard: Dashboard) => {
            deleteDashboard(dashboard);
          },
        },
      ],
    },
  ];

  useEffect(() => {
    const setup = async () => {
      try {
        await getFavsList();
      } catch (err) {
        let message: string = 'Unknown Error in Setup';
        if (err instanceof Error) message = err.message;
        console.log('Setup:' + message);
      }
    };
    setup();
  }, []);

  const getFavsList = async () => {
    const core = getCore();
    const user = getCurrentUser();

    const options = {
      username: user.username,
    };
    try {
      await core.http
        .post('/api/spitting_alpaca/getfavorites', { body: JSON.stringify(options) })
        .then(async (res: any) => {
          console.log(res);
          let tempDashboardHits: Dashboard[] = [];

          let count: number = 0;
          for (const dash of res.ret.hits.hits) {
            let titleObject = await core.savedObjects.client.get<SavedDashboard>(
              'dashboard',
              dash._source.dashid
            );
            tempDashboardHits.push({
              id: count,
              dashid: dash._source.dashid,
              title: titleObject.attributes.title,
              user: user.username,
            });
            count = count + 1;
          }
          setDashboardsList(tempDashboardHits);
          setTableState('DisplayTable');
        });
    } catch (err) {
      let message: string = 'Unknown Error in Setup';
      if (err instanceof Error) message = err.message;
      console.log('Setup:' + message);
      setErrorMessage(message);
      setTableState('Error');
    }
  };

  const navigateToDashboard = (dashboard: Dashboard) => {
    const core = getCore();

    core.application.navigateToApp('dashboards#', {
      path: '/view/' + dashboard.dashid + '?_g=(filters:!()',
      openInNewTab: true,
    });
  };

  const deleteDashboard = async (dashboard: Dashboard) => {
    setTableState('Loading');
    const user = getCurrentUser();
    const core = getCore();

    const options = {
      username: user.username,
      dashid: dashboard.dashid,
    };

    try {
      await core.http
        .post('/api/spitting_alpaca/removefavorite', {
          body: JSON.stringify(options),
        })
        .then(async (res) => {
          let dList: Dashboard[] = dashboardsList;
          let dListIndex: number = dashboardsList.indexOf(dashboard);

          dList.splice(dListIndex, 1);
          setDashboardsList(dList);
        });
    } catch (err) {
      let message: string = 'Unknown Error in Setup';
      if (err instanceof Error) message = err.message;
      console.log('Setup:' + message);
      setErrorMessage(message);
      setTableState('Error');
    }
    setTableState('DisplayTable');
  };

  const onTableChange = ({ page }: Criteria<Dashboard>) => {
    if (page) {
      const { index: pageIndex, size: pageSize } = page;
      setPageIndex(pageIndex);
      setPageSize(pageSize);
    }
  };

  const findUsers = (dashboards: Dashboard[], pageIndex: number, pageSize: number) => {
    let pageOfItems;

    if (!pageIndex && !pageSize) {
      pageOfItems = dashboards;
    } else {
      const startIndex = pageIndex * pageSize;
      pageOfItems = dashboards.slice(
        startIndex,
        Math.min(startIndex + pageSize, dashboards.length)
      );
    }

    return {
      pageOfItems,
      totalItemCount: dashboards.length,
    };
  };

  const { pageOfItems, totalItemCount } = findUsers(dashboardsList, pageIndex, pageSize);

  const pagination = {
    pageIndex,
    pageSize,
    totalItemCount,
    pageSizeOptions: [10, 0],
  };

  let table;

  switch (tableState) {
    case 'Loading':
      table = (
        <div>
          <EuiEmptyPrompt
            icon={<EuiLoadingLogo logo="logoKibana" size="xl" />}
            title={<h2>Loading Dashboards List</h2>}
          />
        </div>
      );
      break;
    case 'DisplayTable':
      table = (
        <div>
          <EuiBasicTable
            tableCaption="Demo for EuiBasicTable with pagination"
            items={pageOfItems}
            columns={columns}
            pagination={pagination}
            onChange={onTableChange}
          />
        </div>
      );
      break;
    case 'Error':
      table = (
        <EuiEmptyPrompt
          iconType="error"
          color="danger"
          title={<h2>Unable to load your dashboards</h2>}
          body={
            <p>There was an error loading the Dashboard dashboards list. Error:"{errorMessage}"</p>
          }
        />
      );
      break;
    default:
      table = <div>Error</div>;
      break;
  }

  return <div>{table}</div>;
};
