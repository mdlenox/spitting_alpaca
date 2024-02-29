import {
  EuiBasicTable,
  EuiButtonIcon,
  EuiConfirmModal,
  EuiContextMenuItem,
  EuiContextMenuPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutHeader,
  EuiPopover,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { DisplayIOCList } from 'plugins/spitting_alpaca/common/types';
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { getCore } from '../../services';
import ViewIOCListEditMode from './viewIOCListEditMode';
import WatcherBuildMenu from './watcher_builder/watcherBuilderMenu';

interface VIOCListProps {
  listName: string;
  id: number;
  list: { fieldName: string; fieldValue: string; rowCount: number; note: string; flag: string }[];
  creationDate: string;
  username: string;
  updateDate: string;
  hasUpdated: boolean;
  elasticID: string;
  additionalUsers: string[];
  description: string;
  closeFlyout: () => void;
  updateFullIOCList: (listName: string) => void;
  updateListFromEdit: (list: DisplayIOCList) => void;
  currentUser: string;
  source: string;
}

const ViewIOCList = (Props: VIOCListProps) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [modalState, setModalState] = useState<String>('ViewMode');
  const [size, setSize] = useState<'s' | 'm'>('s');
  const [editableDescription, setEditableDescription] = useState<string>('');
  const [editableAdditionalUsers, setEditableAdditionalUsers] = useState<string[]>([]);
  const [saveListCondition, setSaveListCondition] = useState<boolean>(false);
  const [selectionList, setSelectionList] = useState<
    { fieldName: string; fieldValue: string; rowCount: number; note: string; flag: string }[]
  >([]);
  const [showConfirmDeleteIOCListModal, setShowConfirmDeleteIOCListModal] =
    useState<boolean>(false);

  useEffect(() => {
    // console.log('this is new2');
    setEditableDescription(Props.description);
    setEditableAdditionalUsers(Props.additionalUsers);
    // console.log(Props.list);
    createSelectionList();
  }, []);

  useEffect(() => {
    // console.log('Modal State: ' + modalState);
  }, [modalState]);

  const checkPermissions = () => {
    let retVal: boolean = false;

    //the permissions is not working for the current user
    // console.log(Props.username);
    // console.log(Props.currentUser);

    try {
      if (Props.additionalUsers != undefined) {
        if (Props.additionalUsers.length != 0) {
          if (
            Props.additionalUsers.includes(Props.currentUser) ||
            Props.currentUser == Props.username
          ) {
            //the additional users list is populated
            retVal = true;
          }
        } else if (Props.currentUser == Props.username) {
          //only need to check the username
          return true;
        }
      } else if (Props.currentUser == Props.username) {
        //only need to check the username
        return true;
      }
    } catch (err) {
      console.log(err);
    }
    return retVal;
  };

  const createSelectionList = () => {
    let newList: {
      fieldName: string;
      fieldValue: string;
      rowCount: number;
      flag: string;
      note: string;
    }[] = [];

    Props.list.forEach((item) => {
      newList.push({
        fieldName: item.fieldName,
        fieldValue: item.fieldValue,
        rowCount: item.rowCount,
        flag: item.flag,
        note: item.note,
      });
    });

    setSelectionList(newList);
  };

  const updateList = (
    updateList: {
      fieldName: string;
      fieldValue: string;
      rowCount: number;
      flag: string;
      note: string;
    }[],
    elasticID: string,
    updateDate: string,
    description: string,
    additionalUsers: string[]
  ) => {
    setSelectionList(updateList);
    setEditableDescription(description);
    setEditableAdditionalUsers(additionalUsers);

    // console.log('Update List from View Mode');
    // console.log(updateList);
    Props.updateListFromEdit({
      listName: Props.listName,
      id: Props.id,
      list: updateList,
      creationDate: Props.creationDate,
      username: Props.username,
      updateDate: updateDate,
      hasUpdated: true,
      elasticID: elasticID,
      additionalUsers: additionalUsers,
      description: description,
      listSource: Props.source,
    });
    setSaveListCondition(false);
  };

  const onButtonClick = () => {
    if (isPopoverOpen) {
      setIsPopoverOpen(false);
    } else {
      setIsPopoverOpen(true);
    }
  };

  const closePopover = () => {
    setIsPopoverOpen(false);
  };

  const closeFlyOut = () => {
    setSize('s');
    setModalState('ViewMode');
    // setEditableDescription(Props.description);
  };

  const editList = () => {
    setSize('m');
    setModalState('EditMode');

    setIsPopoverOpen(false);
  };

  const createWatcher = () => {
    setSize('s');
    setModalState('WatcherMode');
    setIsPopoverOpen(false);
  };

  //this is the click to create a modal so the user doesnt accidenttly delete a list.
  //this modal then calls deleteList
  const clickDeleteList = () => {
    setShowConfirmDeleteIOCListModal(true);
  };

  const deleteList = async () => {
    const core = getCore();
    const options = {
      body: JSON.stringify({
        username: Props.username,
        listName: Props.listName,
      }),
    };

    await core.http.post('/api/spitting_alpaca/deleteioclist', options).then(async (res: any) => {
      // console.log(res);

      if (res.code == 400) {
        core.notifications.toasts.addWarning(
          {
            title: (e) => {
              ReactDOM.render(<EuiText>{res.ret}</EuiText>, e);
              return () => ReactDOM.unmountComponentAtNode(e);
            },
          },
          { toastLifeTimeMs: 3000 }
        );
      } else {
        //if the list is deleted, close the popover and flyout, and display the new list
        Props.updateFullIOCList(Props.listName);
        Props.closeFlyout();
        setIsPopoverOpen(false);
        core.notifications.toasts.addSuccess(
          {
            title: (e) => {
              ReactDOM.render(<EuiText>{res.ret}</EuiText>, e);
              return () => ReactDOM.unmountComponentAtNode(e);
            },
          },
          { toastLifeTimeMs: 3000 }
        );
      }
    });
  };

  const downloadList = () => {
    // console.log('Download List');
    get();
    setIsPopoverOpen(false);
  };

  const download = function (data: BlobPart) {
    const blob = new Blob([data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    let fileName: string = Props.listName + '.csv';
    a.setAttribute('href', url);
    a.setAttribute('download', fileName);

    // Performing a download with click
    a.click();
  };

  const get = async function () {
    const data = [['Fields', 'Selectors']];

    Props.list.forEach((item) => {
      data.push([item.fieldName, item.fieldValue]);
    });

    download(data.join('\n'));
  };

  const onTableChange = ({ page = { index: pageIndex, size: pageSize } }) => {
    const { index: pageIndex, size: pageSize } = page;

    setPageIndex(pageIndex);
    setPageSize(pageSize);
  };

  const actions = checkPermissions()
    ? [
        <EuiContextMenuItem key="edit" icon="documentEdit" onClick={editList}>
          Edit List
        </EuiContextMenuItem>,
        <EuiContextMenuItem key="delete" icon="trash" onClick={clickDeleteList}>
          Delete List
        </EuiContextMenuItem>,
        <EuiContextMenuItem key="download" icon="download" onClick={downloadList}>
          Download List
        </EuiContextMenuItem>,
        <EuiContextMenuItem key="download" icon="securitySignalDetected" onClick={createWatcher}>
          Create Watcher
        </EuiContextMenuItem>,
      ]
    : [
        <EuiContextMenuItem key="download" icon="download" onClick={downloadList}>
          Download List
        </EuiContextMenuItem>,
      ];

  const columns = [
    {
      field: 'fieldName',
      name: 'Field Name',
      sortable: true,
      'data-test-subj': 'fieldNameCell',
    },
    {
      field: 'fieldValue',
      name: 'Selector',
    },
    { field: 'flag', name: 'Flag' },
    { field: 'note', name: 'Notes' },
  ];

  const pagination = {
    pageIndex: pageIndex,
    pageSize: pageSize,
    totalItemCount: selectionList.length,
    pageSizeOptions: [10, 25, 50, 100],
  };

  var pageOfItems = selectionList.slice(pageIndex * pageSize, pageIndex * pageSize + pageSize);

  const createEditList = () => {
    const editList: {
      id: number;
      fieldName: string | null | undefined;
      fieldValue: string;
      online: boolean;
      flag: string;
      note: string;
    }[] = [];

    let i: number = 0;
    selectionList.forEach((element) => {
      editList.push({
        id: i + 1,
        fieldName: element.fieldName,
        fieldValue: element.fieldValue,
        online: true,
        flag: element.flag,
        note: element.note,
      });
      i++;
    });
    return editList;
  };

  //setShowConfirmDeleteIOCListModal
  const closeConfirmDeleteIOCModal = () => {
    setShowConfirmDeleteIOCListModal(false);
  };

  let confirmDeleteIOCListModal;
  if (showConfirmDeleteIOCListModal) {
    confirmDeleteIOCListModal = (
      <EuiConfirmModal
        title="Delete IOC List"
        onCancel={closeConfirmDeleteIOCModal}
        onConfirm={deleteList}
        cancelButtonText="Exit"
        confirmButtonText="Delete List"
        buttonColor="danger"
        defaultFocusedButton="confirm"
      >
        <p>Permanently delete "{Props.listName}"?</p>
      </EuiConfirmModal>
    );
  }

  let updateListline = Props.hasUpdated ? <li>Update Date: {Props.updateDate}</li> : '';

  let viewer;
  switch (modalState) {
    case 'WatcherMode':
      viewer = (
        <div className={'eui-yScroll'}>
          <WatcherBuildMenu
            listName={Props.listName}
            closeWatcher={closeFlyOut}
            IOClist={Props.list}
            watcherCompletedClose={Props.closeFlyout}
          ></WatcherBuildMenu>
        </div>
      );
      break;
    //edit mode is on
    case 'EditMode':
      viewer = (
        <div className={'eui-yScroll'}>
          <ViewIOCListEditMode
            saveListBoolean={saveListCondition}
            list={createEditList()}
            originalList={createEditList()}
            username={Props.username}
            creationDate={Props.creationDate}
            setIsPopoverOpen={closeFlyOut}
            closeEditList={closeFlyOut}
            updateDate={Props.updateDate}
            hasUpdated={Props.hasUpdated}
            elasticID={Props.elasticID}
            listName={Props.listName}
            updateList={updateList}
            additionalUsers={editableAdditionalUsers}
            description={editableDescription}
            closeFlyout={Props.closeFlyout}
          />
        </div>
      );
      break;
    case 'ViewMode':
      viewer = (
        <div className={'eui-yScroll'}>
          <div>
            <EuiFlyoutHeader hasBorder>
              <EuiTitle size="m">
                <h2> {Props.listName} </h2>
              </EuiTitle>
            </EuiFlyoutHeader>
            <EuiFlyoutBody>
              <EuiFlexGroup>
                <EuiFlexItem>
                  <div className="eui-textBreakWord">
                    <li>Author: {Props.username}</li>
                    <li>
                      Description: {editableDescription.length ? editableDescription : 'None'}
                    </li>
                    <li>Creation Date: {Props.creationDate}</li>
                    {updateListline}
                    <li>
                      Additional Users:{' '}
                      {editableAdditionalUsers
                        ? editableAdditionalUsers.toString().replaceAll(',', ' , ')
                        : ''}
                    </li>
                  </div>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiPopover
                    button={
                      <EuiButtonIcon
                        display="empty"
                        size="s"
                        iconType="boxesVertical"
                        aria-label="More"
                        onClick={onButtonClick}
                        color="text"
                      />
                    }
                    isOpen={isPopoverOpen}
                    closePopover={closePopover}
                    panelPaddingSize="none"
                    anchorPosition="downCenter"
                  >
                    <EuiContextMenuPanel size="s" items={actions} />
                  </EuiPopover>
                </EuiFlexItem>
              </EuiFlexGroup>
              <EuiSpacer size="m" />

              <EuiBasicTable
                items={pageOfItems}
                columns={columns}
                pagination={pagination}
                onChange={onTableChange}
              />
            </EuiFlyoutBody>
          </div>
        </div>
      );
      break;
  }

  return (
    <div>
      <EuiFlyout ownFocus onClose={Props.closeFlyout} size={size} aria-labelledby={Props.listName}>
        {viewer}
      </EuiFlyout>
      {confirmDeleteIOCListModal}
    </div>
  );
};

export default ViewIOCList;
