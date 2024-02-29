import {
  EuiBadge,
  EuiBasicTable,
  EuiBasicTableColumn,
  EuiButtonIcon,
  EuiIconTip,
  EuiListGroupItem,
  EuiScreenReaderOnly,
  EuiText,
  RIGHT_ALIGNMENT,
  copyToClipboard,
  EuiFieldSearch,
  EuiFlexItem,
  EuiFlexGroup,
  EuiFormRow,
  EuiSelect,
  EuiLoadingLogo,
  EuiEmptyPrompt,
} from '@elastic/eui';
import { DisplayIOCList } from 'plugins/spitting_alpaca/common/types';

import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { getCore } from '../../services';
import CreateIOCList from './createIOCList';
import ViewIOCList from './viewIOCList';

const IOCSearchListsComponent = () => {
  const [iocList, setiocList] = useState<DisplayIOCList[]>([]);
  const [completeIOCList, setCompleteIOCList] = useState<DisplayIOCList[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [isFlyoutVisible, setIsFlyoutVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState<string>('');
  const [selectedIOCListForViewing, setSelectedIOCListForViewing] = useState<undefined | number>(
    undefined
  );
  const [value, setValue] = useState('');
  const [sources, setSources] = useState<{ value: string; text: string }[]>([
    { value: 'All', text: 'All' },
  ]);
  const [sourceValue, setSourceValue] = useState<string>('All');

  useEffect(() => {
    const setup = async () => {
      await getUser();
      await getIOCLists();
    };
    setup();
  }, []);

  useEffect(() => {
    // filter the ioc list based on the source and value
    // setIsLoadingData(true);
    filterIOCList();
    // setIsLoadingData(false);
  }, [sourceValue, value]);

  useEffect(() => {
    // filter the ioc list based on the source and value
    // setIsLoadingData(true);
  }, [iocList]);

  const filterIOCList = () => {
    let currentIOCList: any[] = [];

    if (sourceValue == 'All' && value.length == 0) {
      //if the search string is empty and the source value is all display the original list

      setiocList(completeIOCList);
    } else if (sourceValue == 'All' && value.length > 0) {
      //if the search string has content and the source value is all search on the source string and display the results

      completeIOCList.forEach((item) => {
        if (item.listName.toLocaleLowerCase().includes(value.toLocaleLowerCase())) {
          currentIOCList.push({
            listName: item.listName,
            id: currentIOCList.length,
            list: item.list,
            creationDate: item.creationDate,
            username: item.username,
            updateDate: item.updateDate,
            hasUpdated: item.hasUpdated,
            elasticID: item.elasticID,
            additionalUsers: item.additionalUsers,
            description: item.description,
            listSource: item.listSource,
          });
        }
      });
      setiocList(currentIOCList);
    } else if (sourceValue != 'All' && value.length == 0) {
      //if source value is not equal to all and the search string is empty
      completeIOCList.forEach((item) => {
        if (item.listSource == sourceValue) {
          currentIOCList.push({
            listName: item.listName,
            id: currentIOCList.length,
            list: item.list,
            creationDate: item.creationDate,
            username: item.username,
            updateDate: item.updateDate,
            hasUpdated: item.hasUpdated,
            elasticID: item.elasticID,
            additionalUsers: item.additionalUsers,
            description: item.description,
            listSource: item.listSource,
          });
        }
      });

      setiocList(currentIOCList);
    } else if (sourceValue != 'All' && value.length > 0) {
      //if source value is not equal to all and thre is a search string

      completeIOCList.forEach((item) => {
        if (
          item.listName.toLocaleLowerCase().includes(value.toLocaleLowerCase()) &&
          item.listSource == sourceValue
        ) {
          currentIOCList.push({
            listName: item.listName,
            id: currentIOCList.length,
            list: item.list,
            creationDate: item.creationDate,
            username: item.username,
            updateDate: item.updateDate,
            hasUpdated: item.hasUpdated,
            elasticID: item.elasticID,
            additionalUsers: item.additionalUsers,
            description: item.description,
            listSource: item.listSource,
          });
        }
      });
      setiocList(currentIOCList);
    }
  };

  const getUser = async () => {
    const core = getCore();
    let user = '';

    await core.http
      .get('/api/spitting_alpaca/getuser')
      .then((res: any) => {
        user = res.username;
        setCurrentUser(user);
      })
      .catch((err) => console.log('getusername failed:' + err));
  };

  const toastMessageSuccess = (message: string) => {
    const core = getCore();
    core.notifications.toasts.addSuccess(
      {
        color: 'success',
        title: (e) => {
          ReactDOM.render(<EuiText>{message}</EuiText>, e);
          return () => ReactDOM.unmountComponentAtNode(e);
        },
      },
      { toastLifeTimeMs: 3000 }
    );
  };

  const toastMessageWarning = (message: string, timer: number) => {
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

  const updateListFromEditView = (rowItem: DisplayIOCList) => {
    let tempList: DisplayIOCList[] = iocList;

    tempList.splice(selectedIOCListForViewing!, 1, rowItem);

    setiocList(tempList);
    setCompleteIOCList(sortIOCList(tempList));
  };

  const updateIOCList = (listItem: {
    listName: string;
    list: any;
    creationDate: string;
    username: string;
    updateDate: string;
    hasUpdated: boolean;
    elasticID: string;
    additionalUsers: string[];
    description: string;
    listSource: string;
  }) => {
    let listItemWithId: DisplayIOCList = {
      listName: listItem.listName,
      id: iocList.length,
      list: JSON.parse(listItem.list),
      creationDate: listItem.creationDate,
      username: listItem.username,
      updateDate: listItem.updateDate,
      hasUpdated: listItem.hasUpdated,
      elasticID: listItem.elasticID,
      additionalUsers: listItem.additionalUsers,
      description: listItem.description,
      listSource: listItem.listSource,
    };
    let updatedList = iocList;
    updatedList.push(listItemWithId);
    setiocList([]);
    setiocList(sortIOCList(updatedList));
    setCompleteIOCList(sortIOCList(updatedList));
  };

  const getIOCLists = async () => {
    const core = getCore();
    let count = 0;
    await core.http.post('/api/spitting_alpaca/getioclists').then((res: any) => {
      let list;
      let tempDisplayList: DisplayIOCList[] = [];
      let tempSourceList: { value: string; text: string }[] = sources;
      try {
        console.log(res);
        list = res.response.body.hits.hits;
        list.forEach((row: any) => {
          tempDisplayList.push({
            listName: row._source.listName,
            id: count,
            list: JSON.parse(row._source.IOCList),
            creationDate: row._source.creationDate,
            username: row._source.username,
            updateDate: row._source.updateDate,
            hasUpdated: row._source.hasUpdated,
            elasticID: row._id,
            additionalUsers: row._source.additionalUsers,
            description: row._source.description,
            listSource: row._source.listSource,
          });
          count++;

          if (
            !tempSourceList.find((value) => value.text === row._source.listSource) &&
            row._source.listSource != undefined
          ) {
            tempSourceList.push({ value: row._source.listSource, text: row._source.listSource });
          }
        });
      } catch (err) {
        toastMessageWarning('List unable to generate', 3000);
      }

      setiocList([]);
      setiocList(sortIOCList(tempDisplayList));
      setCompleteIOCList(sortIOCList(tempDisplayList));
      setSources(tempSourceList);
      setIsLoadingData(false);
    });
  };

  const sortIOCList = (list: DisplayIOCList[]) => {
    list.sort((a, b) => {
      let la = a.listName?.toLocaleLowerCase(),
        lb = b.listName?.toLocaleLowerCase();
      if (la === 'undifined' || lb === 'undifined') {
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
    let count = 0;
    let sortedAndOrderedList: DisplayIOCList[] = [];

    list.forEach((item) => {
      sortedAndOrderedList.push({
        listName: item.listName,
        id: count,
        list: item.list,
        creationDate: item.creationDate,
        username: item.username,
        updateDate: item.updateDate,
        hasUpdated: item.hasUpdated,
        elasticID: item.elasticID,
        additionalUsers: item.additionalUsers,
        description: item.description,
        listSource: item.listSource,
      });
      count++;
    });

    return sortedAndOrderedList;
  };

  const columns: EuiBasicTableColumn<{ listName: string; id: number; list: any }>[] = [
    {
      field: 'listName',

      name: (
        <div>
          IOC Lists
          <EuiIconTip
            type="iInCircle"
            color="subdued"
            content={<span>IOC List only show the first 10 items</span>}
          />
        </div>
      ),
      render: (item: { listName: string; id: number; list: any }) => {
        return (
          <EuiBadge
            iconType="tableDensityCompact"
            iconSide="left"
            color="#343741"
            style={{ width: '100%' }}
          >
            <EuiListGroupItem wrapText label={item}></EuiListGroupItem>
          </EuiBadge>
        );
      },
    },
    {
      align: RIGHT_ALIGNMENT,
      width: '40px',
      isExpander: true,
      name: (
        <EuiScreenReaderOnly>
          <span>Expand rows</span>
        </EuiScreenReaderOnly>
      ),
      render: (item: { listName: string; id: number; list: any }) => (
        <EuiButtonIcon
          onClick={() => {
            setSelectedIOCListForViewing(item.id);
            showFlyout();
          }}
          aria-label="popout"
          iconType="popout"
        />
      ),
    },
    {
      align: RIGHT_ALIGNMENT,
      width: '40px',
      isExpander: true,
      name: (
        <EuiScreenReaderOnly>
          <span>Expand rows</span>
        </EuiScreenReaderOnly>
      ),
      render: (item: { listName: string; id: number; list: any }) => (
        <EuiButtonIcon
          onClick={() => copDSLFilter(item.list, item.listName)}
          aria-label="copyClipboard"
          iconType="copyClipboard"
        />
      ),
    },
  ];

  const updateFullIOCList = (listName: string) => {
    let newList: DisplayIOCList[] = [];

    for (let i = 0; i < iocList.length; i++) {
      if (iocList[i].listName != listName) {
        newList.push({
          listName: iocList[i].listName,
          id: i,
          list: iocList[i].list,
          creationDate: iocList[i].creationDate,
          username: iocList[i].username,
          updateDate: iocList[i].updateDate,
          hasUpdated: iocList[i].hasUpdated,
          elasticID: iocList[i].elasticID,
          additionalUsers: iocList[i].additionalUsers,
          description: iocList[i].description,
          listSource: iocList[i].listSource,
        });
      }
    }
    setiocList(sortIOCList(newList));
    setCompleteIOCList(sortIOCList(newList));
  };

  const copDSLFilter = (iocList: any, listName: string) => {
    let filter: string = '{ "query": { "bool": { "should": [';
    try {
      iocList.forEach((element: any) => {
        filter = filter.concat(
          '{ "match_phrase": { "' + element.fieldName + '":"' + element.fieldValue + '" } },'
        );
      });
    } catch (err) {
      toastMessageWarning(err, 3000);
      console.log(err);
    }
    filter = filter.slice(0, filter.length - 1);
    filter = filter.concat('], "minimum_should_match": 1 } }}');
    toastMessageSuccess(listName + ' Copied to clipboard');
    copyToClipboard(filter);
  };

  var pageOfItems = iocList.slice(pageIndex * pageSize, pageIndex * pageSize + pageSize);

  const pagination = {
    pageIndex: pageIndex,
    pageSize: pageSize,
    totalItemCount: iocList.length,
    pageSizeOptions: [10, 25],
  };

  const onTableChange = ({ page = { index: pageIndex, size: pageSize } }) => {
    const { index: pageIndex, size: pageSize } = page;

    setPageIndex(pageIndex);
    setPageSize(pageSize);
  };

  const onSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  const onSourceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSourceValue(e.target.value);
  };

  const list = isLoadingData ? (
    <div>
      <EuiEmptyPrompt
        icon={<EuiLoadingLogo logo="logoKibana" size="xl" />}
        title={<h2>Loading IOC Lists</h2>}
      />
    </div>
  ) : (
    <div>
      <EuiFlexGroup gutterSize="s" responsive={false} wrap>
        <EuiFlexItem>
          <EuiFieldSearch
            placeholder="Search IOC list"
            value={value}
            onChange={(e) => onSearchChange(e)}
            isClearable={true}
            aria-label="Use aria labels when no actual label is in use"
          />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiSelect
            value={sourceValue}
            options={sources}
            prepend={'Source'}
            onChange={(e) => onSourceChange(e)}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiFormRow fullWidth>
        <EuiFlexItem>
          <EuiBasicTable
            itemID="id"
            isExpandable={true}
            items={pageOfItems}
            columns={columns}
            pagination={pagination}
            onChange={onTableChange}
          />
        </EuiFlexItem>
      </EuiFormRow>
    </div>
  );

  const closeFlyout = () => {
    setIsFlyoutVisible(false);
    setSelectedIOCListForViewing(undefined);
  };

  const showFlyout = () => setIsFlyoutVisible(true);

  let flyout;
  if (isFlyoutVisible) {
    flyout = (
      <ViewIOCList
        listName={iocList[selectedIOCListForViewing!].listName}
        list={iocList[selectedIOCListForViewing!].list}
        id={iocList[selectedIOCListForViewing!].id}
        creationDate={iocList[selectedIOCListForViewing!].creationDate}
        username={iocList[selectedIOCListForViewing!].username}
        description={iocList[selectedIOCListForViewing!].description}
        closeFlyout={closeFlyout}
        updateFullIOCList={updateFullIOCList}
        updateDate={iocList[selectedIOCListForViewing!].updateDate}
        hasUpdated={iocList[selectedIOCListForViewing!].hasUpdated}
        elasticID={iocList[selectedIOCListForViewing!].elasticID}
        additionalUsers={iocList[selectedIOCListForViewing!].additionalUsers}
        updateListFromEdit={updateListFromEditView}
        currentUser={currentUser}
        source={iocList[selectedIOCListForViewing!].listSource}
      />
    );
  }

  return (
    <div>
      {flyout}
      <CreateIOCList updateIOCList={updateIOCList} />
      {list}
    </div>
  );
};

export default IOCSearchListsComponent;
