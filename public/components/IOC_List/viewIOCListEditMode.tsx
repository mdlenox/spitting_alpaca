import React, { useState, useRef, useEffect } from 'react';
import {
  Comparators,
  EuiBasicTable,
  EuiBasicTableColumn,
  EuiTableSelectionType,
  EuiTableSortingType,
  Criteria,
  EuiButton,
  EuiSpacer,
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiConfirmModal,
  EuiButtonEmpty,
  EuiFlyoutHeader,
  EuiTitle,
  EuiFlyoutBody,
  EuiTextArea,
  EuiComboBox,
} from '@elastic/eui';
import { AddSelectorModal } from './addSelctorModal';
import AppendList from './appendList';
// import { AppendList } from './appendList';
import { getCore } from '../../services';
import ReactDOM from 'react-dom';
import { isValid } from '../../../common/helpers';

interface VIOCListProps {
  username: string;
  creationDate: string;
  updateDate: string;
  hasUpdated: boolean;
  elasticID: string;
  listName: string;
  additionalUsers: string[];
  description: string;
  // originalDescription: string;
  saveListBoolean: boolean;
  setIsPopoverOpen: (arg0: Boolean) => void;
  closeEditList: () => void;
  closeFlyout: () => void;
  updateList: (
    list: {
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
  ) => void;
  list: {
    id: number;
    fieldName: string | null | undefined;
    fieldValue: string;
    note: string;
    flag: string;
    online: boolean;
  }[];
  originalList: {
    id: number;
    fieldName: string | null | undefined;
    fieldValue: string;
    flag: string;
    note: string;
    online: boolean;
  }[];
}

type IOCList = {
  id: number;
  fieldName: string | null | undefined;
  fieldValue: string;
  flag: string;
  note: string;
  online: boolean;
};

const ViewIOCListEditMode = (Props: VIOCListProps) => {
  const [pageSize, setPageSize] = useState(10);
  const [pageIndex, setPageIndex] = useState(0);
  const [isEditDetailsModalVisable, setIsEditDetailsModalVisable] = useState<boolean>(false);
  const [selectedItems, setSelectedItems] = useState<IOCList[]>([]);
  const [sortField, setSortField] = useState<keyof IOCList>('fieldName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isAddSelctorModalVisible, setIsAddSelctorModalVisible] = useState<Boolean>(false);
  const [isAppendListVisible, setIsAppendListVisible] = useState<Boolean>(false);
  const [isConfirmationModalVisible, setIsConfirmationModalVisible] = useState<Boolean>(false);
  const [displayList, setDisplayList] = useState<
    {
      id: number;
      fieldName: string | null | undefined;
      fieldValue: string;
      note: string;
      flag: string;
      online: boolean;
    }[]
  >([]);

  //to have an editable description and additional users fields we must create several variables
  const [description, setDescription] = useState<string>(Props.description); //this is the description used in the editDetials modal to the user can type the new description and apply it
  const [editableDescription, setEditableDescription] = useState<string>(''); //this is the description that gets displayed to the user in the edit menu
  const [originalDescription, setOriginalDescirption] = useState<string>(Props.description); //this is what is used to compare the description to changed descriptions

  const [selectedOptions, setSelected] = useState<{ label: string }[]>([]);
  const [additionalUsers, setAdditionalUsers] = useState<string[]>(Props.additionalUsers);
  const [editableAdditionalUsers, setEditableAdditionalUsers] = useState<string[]>([]);
  const [originalAdditionalUsers, setOriginalAdditionalUsers] = useState<string[]>(
    Props.additionalUsers
  );
  const [isInvalid, setInvalid] = useState(false);

  useEffect(() => {
    setSelected(getAdditionalUsers());
    setEditableDescription(Props.description);
    setEditableAdditionalUsers(Props.additionalUsers);
    setDisplayList(Props.list);
  }, []);

  const getAdditionalUsers = () => {
    //the combo model requires this format for the individual users
    let retVal: { label: string }[] = [];

    Props.additionalUsers.forEach((item) => {
      retVal.push({ label: item });
    });
    return retVal;
  };

  const columns: Array<EuiBasicTableColumn<IOCList>> = [
    {
      field: 'fieldName',
      name: 'Field Name',
      truncateText: true,
      mobileOptions: {
        render: (item: IOCList) => <span>{item.fieldName}</span>,

        header: false,
        truncateText: false,
        enlarge: true,
        width: '100%',
      },
    },
    {
      field: 'fieldValue',
      name: 'Selector',
      truncateText: true,
      mobileOptions: {
        show: false,
      },
    },
    {
      field: 'flag',
      name: 'Flag',
      truncateText: true,
    },
    {
      field: 'note',
      name: 'Notes',
      truncateText: true,
    },
  ];

  const tableRef = useRef<EuiBasicTable | null>(null);

  // these should really be stored in a common
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

  const onSelectionChange = (selectedItems: IOCList[]) => {
    setSelectedItems(selectedItems);
  };

  const selection: EuiTableSelectionType<IOCList> = {
    selectable: (item: IOCList) => item.online,
    selectableMessage: (selectable: boolean) => (!selectable ? 'User is currently offline' : ''),
    onSelectionChange,
    initialSelected: [],
  };

  const deleteUsersByIds = (...ids: number[]) => {
    ids.forEach((id) => {
      const index = displayList.findIndex((item) => item.id === id);
      if (index >= 0) {
        displayList.splice(index, 1);
      }
    });
  };

  const deleteSelectors = () => {
    deleteUsersByIds(...selectedItems.map((item: IOCList) => item.id));
    setSelectedItems([]);
  };

  const isDeleteButtonDisabled = () => {
    if (selectedItems.length == 0) {
      return true;
    } else {
      return false;
    }
  };

  const onTableChange = ({ page, sort }: Criteria<IOCList>) => {
    if (page) {
      const { index: pageIndex, size: pageSize } = page;
      setPageIndex(pageIndex);
      setPageSize(pageSize);
    }
    if (sort) {
      const { field: sortField, direction: sortDirection } = sort;
      setSortField(sortField);
      setSortDirection(sortDirection);
    }
  };

  const appendList = () => {
    openAppendList();
  };

  const addSelectors = () => {
    openAddSelectorModal();
  };

  const getElasticID = async () => {
    // get the elastic id of the current list so it can be edited
    const core = getCore();

    let returnID: string | undefined = '';

    let options = {
      body: JSON.stringify({
        listName: Props.listName,
        creationDate: Props.creationDate,
      }),
    };

    await core.http.post('/api/spitting_alpaca/getioclistid', options).then(async (res: any) => {
      // console.log('ID Log');
      console.log(res);
      try {
        returnID = res.response.body.hits.hits[0]._id;
      } catch (err) {
        console.log(err);
        toastMessageWarning(err, 3000);
        returnID = undefined;
      }
      if (res.status == 400) {
        toastMessageWarning('List ID Acquisition Failure', 3000);
        returnID == undefined;
      }
    });

    return returnID;
  };

  const saveList = async () => {
    const core = getCore();
    let id: string = Props.elasticID;

    let updatedRow: {
      fieldName: string;
      fieldValue: string;
      rowCount: number;
      flag: string;
      note: string;
    }[] = formatListForUpdate();

    //update the list display, we need to format the list as well to the orinignal format not the edit format
    // console.log('UpdateList from viewListEditMode');
    Props.updateList(
      updatedRow,
      Props.elasticID,
      await new Date().toISOString(),
      editableDescription,
      editableAdditionalUsers
    );

    //if the elasticID is equal to 0 then the list was just added and an easticID was unable to be obtained.
    //If its 0 we need to get the elastic _id as its needed to update an individual list
    if (Props.elasticID == '0') {
      //get List id
      id = await getElasticID();
    }

    let options = {
      body: JSON.stringify({
        username: Props.username,
        IOCList: JSON.stringify(displayList),
        listName: Props.listName,
        creationDate: Props.creationDate,
        updateDate: await new Date().toISOString(),
        hasUpdated: true,
        id: Props.elasticID,
        description: editableDescription,
        additionalUsers: editableAdditionalUsers,
      }),
    };
    if (id != undefined) {
      //if the id is undefined the id could not be located and the list cannot be updated
      core.http.post('/api/spitting_alpaca/updateioclist', options).then(async (res: any) => {
        console.log(res);
        toastMessageSuccess('List Saved');
        setOriginalDescirption(editableDescription);
        setOriginalAdditionalUsers(editableAdditionalUsers);
      });
    }
    closeConfirmationModal();
  };

  const compareStringArray = (a: string[], b: string[]) => {
    let aSorted: string[] = a.sort((a, b) => {
      if (a < b) {
        return -1;
      } else {
        return 1;
      }
    });

    let bSorted = b.sort((a, b) => {
      if (a < b) {
        return -1;
      } else {
        return 1;
      }
    });

    return !(aSorted.toString() === bSorted.toString());
  };

  const isSaveButtonDisabled = () => {
    let listChanges = Props.originalList.filter((x) => {
      if (
        displayList.find(
          (element) => x.fieldValue == element.fieldValue && x.fieldName == element.fieldName
        )
      ) {
      } else {
        return x;
      }
    });

    //need a way of comparing the original additionalUserList to the new one so the save button can work

    if (
      listChanges.length != 0 ||
      displayList.length != Props.originalList.length ||
      editableDescription != originalDescription ||
      compareStringArray(editableAdditionalUsers, originalAdditionalUsers)
    ) {
      return false;
    }
    return true;
  };

  const formatListForUpdate = () => {
    let updateList: {
      fieldName: string;
      fieldValue: string;
      rowCount: number;
      flag: string;
      note: string;
    }[] = [];

    displayList.forEach((row) => {
      updateList.push({
        fieldName: row.fieldName!,
        fieldValue: row.fieldValue,
        rowCount: row.id,
        flag: row.flag,
        note: row.note,
      });
    });

    return updateList;
  };

  const findUsers = (
    users: IOCList[],
    pageIndex: number,
    pageSize: number,
    sortField: keyof IOCList,
    sortDirection: 'asc' | 'desc'
  ) => {
    let items;

    if (sortField) {
      items = displayList
        .slice(0)
        .sort(Comparators.property(sortField, Comparators.default(sortDirection)));
    } else {
      items = displayList;
    }

    let pageOfItems;

    if (!pageIndex && !pageSize) {
      pageOfItems = items;
    } else {
      const startIndex = pageIndex * pageSize;
      pageOfItems = items.slice(startIndex, Math.min(startIndex + pageSize, displayList.length));
    }

    return {
      pageOfItems,
      totalItemCount: displayList.length,
    };
  };

  const { pageOfItems, totalItemCount } = findUsers(
    displayList,
    pageIndex,
    pageSize,
    sortField,
    sortDirection
  );

  const pagination = {
    pageIndex: pageIndex,
    pageSize: pageSize,
    totalItemCount: totalItemCount,
    pageSizeOptions: [15, 25, 50, 100],
  };

  const sorting: EuiTableSortingType<IOCList> = {
    sort: {
      field: sortField,
      direction: sortDirection,
    },
  };

  const openAddSelectorModal = () => {
    setIsAddSelctorModalVisible(true);
  };

  const closeAddSelectorModal = () => {
    // console.log('close other modal');
    setIsAddSelctorModalVisible(false);
  };

  const openAppendList = () => {
    // console.log('open');
    setIsAppendListVisible(true);
  };

  const closeAppendList = () => {
    // console.log('setting append list to close');
    setIsAppendListVisible(false);
  };

  const addAppendList = (
    list: {
      id: number;
      fieldName: string | null | undefined;
      fieldValue: string;
      flag: string;
      note: string;
      online: boolean;
    }[]
  ) => {
    //check for empty display list

    if (displayList.length == 0) {
      //if the display list is empty just add the list
      setIsAddSelctorModalVisible(false);
      setDisplayList(list);
      return;
    } else if (list.length == 0) {
      //if the append list is ==0 just return
      return;
    }

    //check for duplicates

    let appendList: {
      id: number;
      fieldName: string | null | undefined;
      fieldValue: string;
      flag: string;
      note: string;
      online: boolean;
    }[] = displayList;

    //this is the final list we use so that all the index numbers are correctly set
    let updateList: {
      id: number;
      fieldName: string | null | undefined;
      fieldValue: string;
      flag: string;
      note: string;
      online: boolean;
    }[] = [];
    list.forEach((row) => {
      //if the row already exists we dont add it to the list
      let duplicateFlag: boolean = false; //if the flag is true there is a duplicate

      for (let i = 0; i <= appendList.length - 1; i++) {
        if (
          row.fieldName == appendList[i].fieldName &&
          row.fieldValue == appendList[i].fieldValue
        ) {
          // console.log('Match');
          duplicateFlag = true;
        }
      }

      if (duplicateFlag != true) {
        appendList.push({
          id: appendList.length + 1,
          fieldName: row.fieldName,
          fieldValue: row.fieldValue,
          note: row.note,
          flag: row.flag,
          online: row.online,
        });
      }
    });

    appendList.forEach((row, index) => {
      updateList.push({
        id: index,
        fieldName: row.fieldName,
        fieldValue: row.fieldValue,
        note: row.note,
        flag: row.flag,
        online: row.online,
      });
    });

    setIsAddSelctorModalVisible(false);
    setDisplayList(updateList);
  };

  const deleteList = (
    deleteSelectors: {
      id: number;
      fieldName: string | null | undefined;
      fieldValue: string;
      note: string;
      flag: string;
      online: boolean;
    }[]
  ) => {
    //check for duplicates

    // console.log(deleteSelectors);
    // console.log(displayList);

    let mainList: {
      id: number;
      fieldName: string | null | undefined;
      fieldValue: string;
      flag: string;
      note: string;
      online: boolean;
    }[] = displayList;

    //this is the final list we use so that all the index numbers are correctly set
    let updateList: {
      id: number;
      fieldName: string | null | undefined;
      fieldValue: string;
      flag: string;
      note: string;
      online: boolean;
    }[] = [];

    var count: number = 0;
    let deletionFlag: boolean = false; //this flag show whether or not the current list element will be add to the list or not
    for (let i = 0; i < mainList.length; i++) {
      deletionFlag = false;
      for (let x = 0; x < deleteSelectors.length; x++) {
        if (
          mainList[i].fieldName == deleteSelectors[x].fieldName &&
          mainList[i].fieldValue == deleteSelectors[x].fieldValue
        ) {
          deletionFlag = true;
        }
      }
      if (!deletionFlag) {
        //if the deletion flag is true the list item should NOT be added to the list
        //if the deletion flag is false the item was not found in the deletion list and should be added
        updateList.push(mainList[i]);
        // update the counter only id an item is added so the list is properly indexed
        count++;
        //set the deletion flag back to the false
        deletionFlag = false;
      }
    }

    setIsAddSelctorModalVisible(false);
    setDisplayList(updateList);
  };

  const closeConfirmationModal = () => setIsConfirmationModalVisible(false);
  const showConfirmationModal = () => setIsConfirmationModalVisible(true);

  let updateListline = Props.hasUpdated ? <li>Update Date: {Props.updateDate}</li> : '';

  let confirmationModal;

  if (isConfirmationModalVisible) {
    confirmationModal = (
      <EuiConfirmModal
        style={{ width: 600 }}
        title="Save List"
        onCancel={closeConfirmationModal}
        onConfirm={saveList}
        cancelButtonText="Continue Edit"
        confirmButtonText="Save List"
        defaultFocusedButton="confirm"
      >
        <p>The list contents will be saved permanently.</p>
      </EuiConfirmModal>
    );
  }

  const closeEditDetailsModal = () => {
    let newSelectedOptions: { label: string }[] = [];

    editableAdditionalUsers.forEach((item) => {
      newSelectedOptions.push({ label: item });
    });

    setDescription(editableDescription);
    setAdditionalUsers(editableAdditionalUsers);
    setSelected(newSelectedOptions);
    setIsEditDetailsModalVisable(false);
  };

  const showEditDetailsModal = () => {
    setIsEditDetailsModalVisable(true);
  };

  const applyDetailsEdit = (description: string) => {
    if (description.length > 500) {
      toastMessageWarning('List description longer than 500 characters', 3000);
      return;
    }
    setEditableDescription(description.trim());
    setEditableAdditionalUsers(getSelectedUser());
    setIsEditDetailsModalVisable(false);
  };

  const onCreateOption = (searchValue: any) => {
    if (!isValid(searchValue) || searchValue == Props.username) {
      // Return false to explicitly reject the user's input.
      return false;
    }

    const newOption = {
      label: searchValue,
    };

    // Select the option.
    setSelected([...selectedOptions, newOption]);
  };

  const onSearchChange = (searchValue: any) => {
    if (!searchValue) {
      setInvalid(false);

      return;
    }

    setInvalid(!isValid(searchValue));
  };

  const onChange = (selectedOptions: React.SetStateAction<{ label: string }[]>) => {
    setSelected(selectedOptions);
    setInvalid(false);
  };

  const getSelectedUser = () => {
    let retValue: string[] = [];

    selectedOptions.forEach((item) => {
      retValue.push(item.label);
    });

    return retValue;
  };

  let editDetailsModal;
  if (isEditDetailsModalVisable) {
    let descriptionCount =
      description.length < 501 ? (
        <p>{description.length} / 500</p>
      ) : (
        <p style={{ color: 'red' }}>{+description.length} / 500</p>
      );

    editDetailsModal = (
      <EuiConfirmModal
        style={{ width: 600 }}
        title="Edit List Details"
        onCancel={closeEditDetailsModal}
        onConfirm={() => {
          applyDetailsEdit(description);
        }}
        cancelButtonText="Exit"
        confirmButtonText="Apply"
      >
        <p>Description</p>
        <EuiTextArea
          placeholder="Description"
          value={description}
          fullWidth={true}
          onChange={(e) => setDescription(e.target.value)}
          aria-label="Use aria labels when no actual label is in use"
        />
        {descriptionCount}
        <p>Additional Users</p>
        <EuiComboBox
          noSuggestions
          placeholder="Enter username/s"
          selectedOptions={selectedOptions}
          onCreateOption={onCreateOption}
          onChange={onChange}
          onSearchChange={onSearchChange}
          isInvalid={isInvalid}
        />
      </EuiConfirmModal>
    );
  }

  return (
    <div>
      {confirmationModal}
      {editDetailsModal}

      <EuiFlyoutHeader hasBorder>
        <EuiTitle size="l">
          <h2> {Props.listName}(Editing) </h2>
        </EuiTitle>
        <EuiButtonEmpty size="s" onClick={showEditDetailsModal}>
          Edit Details
        </EuiButtonEmpty>
      </EuiFlyoutHeader>
      <EuiFlyoutBody>
        <EuiFlexGroup>
          <EuiFlexItem>
            <div className="eui-textBreakWord">
              <li>Author: {Props.username}</li>
              <li>Description: {editableDescription.length ? editableDescription : 'None'}</li>
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
        </EuiFlexGroup>
        <EuiSpacer size="s" />

        <EuiFlexGroup>
          <EuiFlexItem grow={false}>
            <EuiButton iconType="plus" size="s" onClick={addSelectors}>
              Add selectors
            </EuiButton>
          </EuiFlexItem>

          <EuiFlexItem grow={false}>
            <EuiButton iconType="listAdd" size="s" onClick={appendList}>
              Append list
            </EuiButton>
          </EuiFlexItem>

          <EuiFlexItem grow={false}>
            <EuiButton
              iconType="eraser"
              size="s"
              color="danger"
              onClick={deleteSelectors}
              isDisabled={isDeleteButtonDisabled()}
            >
              Delete selected
            </EuiButton>
          </EuiFlexItem>

          <EuiFlexItem grow={false}>
            <EuiButton
              iconType="save"
              size="s"
              onClick={showConfirmationModal}
              isDisabled={isSaveButtonDisabled()}
            >
              Save
            </EuiButton>
          </EuiFlexItem>

          <EuiFlexItem grow={false}>
            <EuiButton iconType="exit" size="s" onClick={Props.closeEditList}>
              Exit edit
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size="s" />
        <hr style={{ color: 'black', backgroundColor: 'black', height: 0.5 }} />

        <EuiSpacer size="m" />

        <EuiBasicTable
          tableCaption="Demo for EuiBasicTable with selection"
          ref={tableRef}
          items={pageOfItems}
          itemId="id"
          columns={columns}
          pagination={pagination}
          sorting={sorting}
          isSelectable={true}
          selection={selection}
          onChange={onTableChange}
          rowHeader="firstName"
        />
        {isAddSelctorModalVisible ? (
          <AddSelectorModal
            closeAddSelectorModal={closeAddSelectorModal}
            addAppendList={addAppendList}
          />
        ) : (
          <div></div>
        )}
        {isAppendListVisible ? (
          <AppendList
            closeAppendList={closeAppendList}
            addAppendList={addAppendList}
            deleteList={deleteList}
          />
        ) : (
          <div></div>
        )}
      </EuiFlyoutBody>
    </div>
  );
};
export default ViewIOCListEditMode;
