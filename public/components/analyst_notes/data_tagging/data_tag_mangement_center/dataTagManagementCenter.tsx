import React, { useEffect, useState } from 'react';
import {
  EuiText,
  EuiSpacer,
  EuiFlexItem,
  EuiButton,
  EuiFlexGroup,
  EuiEmptyPrompt,
  EuiLoadingLogo,
  EuiFieldSearch,
  EuiPageHeader,
  EuiIcon,
} from '@elastic/eui';
import { getCore, getCurrentUser } from '../../../../services';
import ReactDOM from 'react-dom';
import DataTagsTable from './dataTagsTable';
import CreateDataTag from '../createDataTag';
import { DataTagHit } from 'plugins/spitting_alpaca/common/types';

export interface DataTag {
  id: number;
  tag: string;
  details: string;
  owner: string;
  users: string[];
  timestamp: string;
  _id: string;
}

const DataTagManagementCenter = () => {
  const [tableRows, setTableRows] = useState<DataTag[]>([]);
  const [completeTableRows, setCompleteTableRows] = useState<DataTag[]>([]);
  const [currentModal, setCurrentModal] = useState('none');
  const [currentTags, setCurrentTags] = useState<string[]>([]);
  const [username, setUsername] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [tableState, setTableState] = useState<string>('loading');

  useEffect(() => {
    const setup = async () => {
      try {
        await getUser();
        await getTags();
      } catch (err) {
        let message: string = 'Unknown Error in Setup';
        if (err instanceof Error) message = err.message;
        console.log('Setup:' + message);
      }
    };
    setup();
  }, []);

  const toastMessageSuccess = (message: string | JSX.Element, timer: number) => {
    const core = getCore();

    core.notifications.toasts.addSuccess(
      {
        color: 'success',
        title: (e) => {
          ReactDOM.render(<EuiText>{message}</EuiText>, e);
          return () => ReactDOM.unmountComponentAtNode(e);
        },
      },
      { toastLifeTimeMs: timer }
    );
  };

  const toastMessageWarning = (message: string | JSX.Element, timer: number) => {
    const core = getCore();
    core.notifications.toasts.addWarning(
      {
        color: 'warning',
        title: (e) => {
          ReactDOM.render(<EuiText>{message}</EuiText>, e);
          return () => ReactDOM.unmountComponentAtNode(e);
        },
      },
      { toastLifeTimeMs: timer }
    );
  };

  //Get user specific data tags API call
  const getTags = async () => {
    setTableState('loading');

    const core = getCore();

    await core.http
      .post('/api/spitting_alpaca/getalltags')
      .then(async (res: any) => {
        console.log(res);
        //Check for empty items
        if (res.response.length < 1) {
          setTableState('emptyTable');
          //Otherwise, handle the response
        } else {
          let tempTags: string[] = [];
          let tempMappings: DataTag[] = [];

          let count = 0;
          res.response?.forEach((dataTag: DataTagHit) => {
            tempMappings.push({
              id: count,
              tag: dataTag._source.tag,
              details: dataTag._source.details,
              owner: dataTag._source.owner,
              users: dataTag._source.users,
              timestamp: dataTag._source.timestamp,
              _id: dataTag._id,
            });
            count = count + 1;

            tempMappings.forEach((mapping) => {
              //Push all found tags to currentTags
              tempTags.push(mapping.tag);
            });
          });

          //sort the tempMappings
          tempMappings.sort((a: { tag: string }, b: { tag: string }) => {
            let la = a.tag?.toLocaleLowerCase(),
              lb = b.tag?.toLocaleLowerCase();
            if (la === undefined || lb === undefined) {
              return 0;
            } else {
              if (la < lb) {
                return -1;
              }
              if (la > lb) {
                return 1;
              }
            }
            return 0;
          });

          setCurrentTags(tempTags);
          setTableRows(tempMappings);
          setCompleteTableRows(tempMappings);
          setTableState('displayTable');
        }
      })
      .catch((err) => console.log(err));

    return;
  };

  const pushTagToCurrentTags = (tag: string) => {
    currentTags.push(tag);
  };

  const delay = (time: number) => {
    return new Promise((resolve) => setTimeout(resolve, time));
  };

  const onCreateClick = () => {
    setCurrentModal('create');
  };

  const closeModal = () => {
    setCurrentModal('none');
  };

  const getUser = async () => {
    const user = getCurrentUser();

    setUsername(user.username);
  };

  const updateTable = async (newTable: DataTag[]) => {
    setTableState('loading');
    if (newTable.length < 1) {
      setTableState('emptyTable');
    }

    let tempTagsList: string[] = [];

    newTable.forEach((dataTag: DataTag) => {
      tempTagsList.push(dataTag.tag);
    });
    setCompleteTableRows([]);
    setCurrentTags(tempTagsList);
    const updateTableObject = [...newTable];
    setTableRows(newTable);
    setCompleteTableRows(updateTableObject);

    setTableState('displayTable');
  };

  let modal;

  switch (currentModal) {
    case 'create':
      modal = (
        <CreateDataTag
          pushTagToCurrentTags={pushTagToCurrentTags}
          closeModal={closeModal}
          getTags={getTags}
          username={username}
          currentTags={currentTags}
        />
      );
      break;
    case 'none':
      break;
    default:
      break;
  }

  let table;

  switch (tableState) {
    case 'loading':
      table = (
        <div>
          <EuiEmptyPrompt
            icon={<EuiLoadingLogo logo="logoKibana" size="xl" />}
            title={<h2>Loading Data Tags</h2>}
          />
        </div>
      );
      break;
    case 'displayTable':
      table = (
        <DataTagsTable
          updateTable={updateTable}
          dataTags={tableRows}
          completeDataTagsList={completeTableRows}
          username={username}
          toastMessageSuccess={toastMessageSuccess}
          toastMessageWarning={toastMessageWarning}
        />
      );
      break;
    case 'emptyTable':
      table = (
        <div>
          <EuiEmptyPrompt
            icon={<EuiIcon type="logoKibana" size="xl" />}
            title={<h2>No Data Tags</h2>}
          />
        </div>
      );

      break;
    case 'emptySearch':
      table = (
        <div>
          <EuiEmptyPrompt
            icon={<EuiIcon type="logoKibana" size="xl" />}
            title={<h2>No Search Results</h2>}
          />
        </div>
      );
      break;
    case 'none':
      break;

    default:
      break;
  }

  const onSearchSubmit = async () => {
    let searchVal = searchValue;

    setTableState('loading');
    setTableRows([]);
    await delay(500);
    if (searchValue.trim().length == 0) {
      setTableRows(completeTableRows);
      if (completeTableRows.length > 0) {
        setTableState('displayTable');
      } else {
        setTableState('emptyTable');
      }
    } else {
      setTableState('loading');

      let newTable: DataTag[] = completeTableRows.filter(function (obj) {
        return obj.tag.toLowerCase().includes(searchVal.trim().toLowerCase());
      });

      setTableRows(newTable);
      if (newTable.length > 0) {
        setTableState('displayTable');
      } else {
        setTableState('emptySearch');
      }
    }
  };

  return (
    <div className="eui-textBreakWord">
      <EuiPageHeader pageTitle="Data Tags">
        <EuiButton iconType="tag" title={`Create Tag`} onClick={onCreateClick}>
          Create Data Tag
        </EuiButton>
      </EuiPageHeader>
      <EuiSpacer size="s" />
      <EuiFlexGroup gutterSize="s">
        <EuiFlexItem style={{ width: 460 }}>
          <EuiFieldSearch
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            isClearable={true}
            fullWidth
            placeholder="Search by Tag"
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButton title="Search" onClick={onSearchSubmit}>
            Search
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiFlexGroup gutterSize="s">
        {/* <EuiSpacer size="m" /> */}
        <EuiFlexItem>{table}</EuiFlexItem>
        {modal}
      </EuiFlexGroup>
    </div>
  );
};
export default DataTagManagementCenter;
