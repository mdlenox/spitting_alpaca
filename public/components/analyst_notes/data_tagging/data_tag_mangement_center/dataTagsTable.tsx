import React, { Component, ReactNode } from 'react';
import {
  EuiButton,
  EuiButtonIcon,
  EuiCheckbox,
  EuiContextMenuItem,
  EuiContextMenuPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPopover,
  EuiSpacer,
  EuiTable,
  EuiTableBody,
  EuiTableFooter,
  EuiTableFooterCell,
  EuiTableHeader,
  EuiTableHeaderCell,
  EuiTableHeaderCellCheckbox,
  EuiTablePagination,
  EuiTableRow,
  EuiTableRowCell,
  EuiTableRowCellCheckbox,
  EuiTableSortMobile,
  EuiTableHeaderMobile,
  EuiScreenReaderOnly,
  EuiTableSortMobileProps,
  LEFT_ALIGNMENT,
  RIGHT_ALIGNMENT,
  Pager,
  SortableProperties,
  EuiEmptyPrompt,
  EuiLoadingLogo,
  EuiModal,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiModalBody,
  EuiModalFooter,
  EuiTextArea,
  EuiComboBox,
  EuiButtonEmpty,
  EuiSwitch,
  EuiSwitchEvent,
  EuiIconTip,
  EuiText,
} from '@elastic/eui';
import { getCore } from '../../../../services';
import { isValid } from '../../../../../common/helpers';
import { DataTag } from './dataTagManagementCenter';

interface State {
  itemIdToSelectedMap: Record<number | string, boolean>;
  itemIdToOpenActionsPopoverMap: Record<number | string, boolean>;
  sortedColumn: keyof DataTag;
  itemsPerPage: number;
  firstItemIndex: number;
  lastItemIndex: number;
  dataTags: DataTag[];
  tableIsLoading: boolean;
  searchValue: string;
  currentModal: string;
  popoverItem: DataTag;
  editDetailsPopoverValue: string;
  editUsersPopoverValue: string[];
  selectedOptions: { label: string }[];
  isInvalid: boolean;
  deleteSwitchOption: boolean;
  docCount: number;
  batchSize: number;
  currentBatch: number;
  executionTime: number;
}

interface Pagination {
  pageIndex: number;
  pageSize: number;
  totalItemCount: number;
}

//New DataTag interfaces *****************

interface DTTProps {
  dataTags: DataTag[];
  completeDataTagsList: DataTag[];
  username: string;
  toastMessageSuccess: (message: string, timer: number) => void;
  toastMessageWarning: (message: string, timer: number) => void;
  updateTable: (newTable: DataTag[]) => void;
}
//************************************* */

export default class extends Component<DTTProps, State> {
  constructor(props: DTTProps) {
    super(props);

    const defaultItemsPerPage = 10;
    this.pager = new Pager(this.items.length, defaultItemsPerPage);

    this.state = {
      itemIdToSelectedMap: {},
      itemIdToOpenActionsPopoverMap: {},
      sortedColumn: 'tag',
      itemsPerPage: defaultItemsPerPage,
      firstItemIndex: this.pager.getFirstItemIndex(),
      lastItemIndex: this.pager.getLastItemIndex(),
      dataTags: this.props.dataTags,
      tableIsLoading: false,
      searchValue: '',
      currentModal: '',
      popoverItem: {
        id: 0,
        tag: '',
        details: '',
        owner: '',
        users: [],
        timestamp: '',
        _id: '',
      },
      editDetailsPopoverValue: '',
      editUsersPopoverValue: [],
      selectedOptions: [],
      isInvalid: false,
      deleteSwitchOption: true,
      docCount: 0,
      batchSize: 0,
      currentBatch: 0,
      executionTime: 0,
    };

    this.sortableProperties = new SortableProperties(
      [
        {
          name: 'tag',
          getValue: (item) => String(item.tag).toLowerCase(),
          isAscending: true,
        },
      ],
      this.state.sortedColumn
    );
  }

  async componentDidMount() {
    // await this.getTags();
  }

  setInvalid = (value: boolean) => {
    this.setState({ isInvalid: value });
  };
  setSelectedOptions = (list: { label: string }[]) => {
    this.setState({ selectedOptions: list });
  };

  //Get user specific data tags API call
  async getTags() {
    this.setState({ tableIsLoading: true });
    const core = getCore();

    //API CALL
    await core.http
      .post('/api/spitting_alpaca/getalltags')
      .then(async (res: any) => {
        //console log the results
        console.log(res);

        //handle an empty result
        if (res.response.length < 1) {
          this.setState({ tableIsLoading: false });
          this.setState({ dataTags: [] });
        } else {
          //handle data tags
          this.setState({ dataTags: this.parseDataTags(res) });
          this.setState({ tableIsLoading: false });
        }
      })
      .catch((err) => console.log(err));
  }

  parseDataTags(res: any) {
    //parse the list of data tags
    let tempRows: any = [];

    //Parse row data and format into table readable object
    for (let i = 0; i < res.response.length; i++) {
      let tempObj: any = [];
      tempObj['id'] = i;
      for (let x = 0; x < res.response[i].length; x++) {
        let keys = Object.keys(res.response[i][x]);
        keys.forEach((key) => {
          tempObj[key] = res.response[i][x][key];
        });
      }
      tempRows.push(Object.assign({}, tempObj));
    }

    //Sort row data on tag field
    tempRows.sort((a: { tag: string }, b: { tag: string }) => {
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
    return tempRows;
  }

  items: DataTag[] = this.props.dataTags;

  //working on making the columns match the rest of the datatags interface
  columns: any[] = [
    //disableing the check box option, i dont think it fits for this useage
    // {
    //   id: 'checkbox',
    //   isCheckbox: true,
    //   textOnly: false,
    //   width: '32px',
    // },
    {
      id: 'tag',
      label: 'Tag',
      footer: <em>Tag</em>,
      alignment: LEFT_ALIGNMENT,
    },
    {
      id: 'details',
      label: 'Details',
      footer: <em>Details</em>,
      alignment: LEFT_ALIGNMENT,
    },
    {
      id: 'owner',
      label: 'Owner',
      footer: <em>Details</em>,
      alignment: LEFT_ALIGNMENT,
    },
    {
      id: 'users',
      label: 'Users',
      footer: 'Users',
      alignment: LEFT_ALIGNMENT,
    },
    {
      id: 'timestamp',
      label: 'Timestamp',
      footer: 'Timestamp',
      alignment: LEFT_ALIGNMENT,
    },
    {
      id: 'actions',
      label: 'Actions',
      isVisuallyHiddenLabel: true,
      alignment: RIGHT_ALIGNMENT,
      isActionsPopover: true,
      width: '32px',
    },
  ];

  sortableProperties: SortableProperties<DataTag>;
  pager: Pager;

  onChangeItemsPerPage = (itemsPerPage: number) => {
    this.pager.setItemsPerPage(itemsPerPage);
    this.setState({
      itemsPerPage,
      firstItemIndex: this.pager.getFirstItemIndex(),
      lastItemIndex: this.pager.getLastItemIndex(),
    });
  };

  onChangePage = (pageIndex: number) => {
    this.pager.goToPageIndex(pageIndex);
    this.setState({
      firstItemIndex: this.pager.getFirstItemIndex(),
      lastItemIndex: this.pager.getLastItemIndex(),
    });
  };

  onSort = (prop: string) => {
    this.sortableProperties.sortOn(prop);

    this.setState({
      sortedColumn: prop as keyof DataTag,
    });
  };

  toggleItem = (itemId: number) => {
    this.setState((previousState) => {
      const newItemIdToSelectedMap = {
        ...previousState.itemIdToSelectedMap,
        [itemId]: !previousState.itemIdToSelectedMap[itemId],
      };

      return {
        itemIdToSelectedMap: newItemIdToSelectedMap,
      };
    });
  };

  toggleAll = () => {
    const allSelected = this.areAllItemsSelected();
    const newItemIdToSelectedMap: State['itemIdToSelectedMap'] = {};
    this.items.forEach((item) => (newItemIdToSelectedMap[item.id] = !allSelected));

    this.setState({
      itemIdToSelectedMap: newItemIdToSelectedMap,
    });
  };

  isItemSelected = (itemId: number) => {
    return this.state.itemIdToSelectedMap[itemId];
  };

  areAllItemsSelected = () => {
    const indexOfUnselectedItem = this.items.findIndex((item) => !this.isItemSelected(item.id));
    return indexOfUnselectedItem === -1;
  };

  areAnyRowsSelected = () => {
    return (
      Object.keys(this.state.itemIdToSelectedMap).findIndex((id) => {
        return this.state.itemIdToSelectedMap[id];
      }) !== -1
    );
  };

  togglePopover = (itemId: number) => {
    this.setState((previousState) => {
      const newItemIdToOpenActionsPopoverMap = {
        ...previousState.itemIdToOpenActionsPopoverMap,
        [itemId]: !previousState.itemIdToOpenActionsPopoverMap[itemId],
      };

      return {
        itemIdToOpenActionsPopoverMap: newItemIdToOpenActionsPopoverMap,
      };
    });
  };

  closePopover = (itemId: number) => {
    // only update the state if this item's popover is open
    if (this.isPopoverOpen(itemId)) {
      this.setState((previousState) => {
        const newItemIdToOpenActionsPopoverMap = {
          ...previousState.itemIdToOpenActionsPopoverMap,
          [itemId]: false,
        };

        return {
          itemIdToOpenActionsPopoverMap: newItemIdToOpenActionsPopoverMap,
        };
      });
    }
  };

  isPopoverOpen = (itemId: number) => {
    return this.state.itemIdToOpenActionsPopoverMap[itemId];
  };

  renderSelectAll = (mobile?: boolean) => {
    return (
      <EuiCheckbox
        id={mobile ? 'selectAllCheckboxMobile' : 'selectAllCheckboxDesktop'}
        label={mobile ? 'Select all rows' : null}
        aria-label="Select all rows"
        title="Select all rows"
        checked={this.areAllItemsSelected()}
        onChange={this.toggleAll.bind(this)}
        type={mobile ? undefined : 'inList'}
      />
    );
  };

  private getTableMobileSortItems() {
    const items: EuiTableSortMobileProps['items'] = [];

    this.columns.forEach((column) => {
      if (column.isCheckbox || !column.isSortable) {
        return;
      }
      items.push({
        name: column.label,
        key: column.id,
        onSort: this.onSort.bind(this, column.id),
        isSorted: this.state.sortedColumn === column.id,
        isSortAscending: this.sortableProperties.isAscendingByName(column.id),
      });
    });
    return items;
  }

  renderHeaderCells() {
    const headers: ReactNode[] = [];

    this.columns.forEach((column, columnIndex) => {
      if (column.isCheckbox) {
        headers.push(
          <EuiTableHeaderCellCheckbox key={column.id} width={column.width}>
            {this.renderSelectAll()}
          </EuiTableHeaderCellCheckbox>
        );
      } else if (column.isVisuallyHiddenLabel) {
        headers.push(
          <EuiTableHeaderCell key={column.id} width={column.width}>
            <EuiScreenReaderOnly>
              <span>{column.label}</span>
            </EuiScreenReaderOnly>
          </EuiTableHeaderCell>
        );
      } else {
        headers.push(
          <EuiTableHeaderCell
            key={column.id}
            align={this.columns[columnIndex].alignment}
            width={column.width}
            onSort={column.isSortable ? this.onSort.bind(this, column.id) : undefined}
            isSorted={this.state.sortedColumn === column.id}
            isSortAscending={this.sortableProperties.isAscendingByName(column.id)}
            mobileOptions={column.mobileOptions}
          >
            {column.label}
          </EuiTableHeaderCell>
        );
      }
    });
    return headers.length ? headers : null;
  }

  showDeleteConfirmationModal() {
    //show modal
  }

  renderRows() {
    const renderRow = (item: DataTag) => {
      const cells = this.columns.map((column) => {
        let child;

        if (column.isCheckbox) {
          return (
            <EuiTableRowCellCheckbox key={column.id}>
              <EuiCheckbox
                id={`${item.id}-checkbox`}
                checked={this.isItemSelected(item.id)}
                onChange={this.toggleItem.bind(this, item.id)}
                type="inList"
                title="Select this row"
                aria-label="Select this row"
              />
            </EuiTableRowCellCheckbox>
          );
        }

        if (column.isActionsPopover) {
          if (item.owner != this.props.username) {
            return (
              <EuiTableRowCell
                key={column.id}
                textOnly={false}
                hasActions={true}
                align="right"
                mobileOptions={{ header: column.label }}
              >
                <EuiPopover
                  id={`${item.id}-actions`}
                  button={
                    <EuiButtonIcon
                      aria-label="Actions"
                      iconType="gear"
                      size="s"
                      color="text"
                      onClick={() => this.togglePopover(item.id)}
                    />
                  }
                  isOpen={this.isPopoverOpen(item.id)}
                  closePopover={() => this.closePopover(item.id)}
                  panelPaddingSize="none"
                  anchorPosition="leftCenter"
                >
                  <EuiContextMenuPanel
                    items={[
                      <EuiContextMenuItem
                        key="B"
                        icon="inspect"
                        onClick={() => {
                          this.setState({
                            currentModal: 'view',
                            popoverItem: item,
                            editDetailsPopoverValue: item.details,
                            editUsersPopoverValue: item.users,
                          });
                          this.closePopover(item.id);
                        }}
                      >
                        View
                      </EuiContextMenuItem>,
                    ]}
                  />
                </EuiPopover>
              </EuiTableRowCell>
            );
          } else {
            return (
              <EuiTableRowCell
                key={column.id}
                textOnly={false}
                hasActions={true}
                align="right"
                mobileOptions={{ header: column.label }}
              >
                <EuiPopover
                  id={`${item.id}-actions`}
                  button={
                    <EuiButtonIcon
                      aria-label="Actions"
                      iconType="gear"
                      size="s"
                      color="text"
                      onClick={() => this.togglePopover(item.id)}
                    />
                  }
                  isOpen={this.isPopoverOpen(item.id)}
                  closePopover={() => this.closePopover(item.id)}
                  panelPaddingSize="none"
                  anchorPosition="leftCenter"
                >
                  <EuiContextMenuPanel
                    items={[
                      <EuiContextMenuItem
                        key="A"
                        icon="pencil"
                        onClick={() => {
                          this.setState({
                            currentModal: 'edit',
                            editDetailsPopoverValue: item.details,
                            selectedOptions: this.createSelectedOptions(item.users),
                            popoverItem: item,
                          });
                          this.closePopover(item.id);
                        }}
                      >
                        Edit
                      </EuiContextMenuItem>,
                      <EuiContextMenuItem
                        key="B"
                        icon="inspect"
                        onClick={() => {
                          this.setState({
                            currentModal: 'view',
                            popoverItem: item,
                            editDetailsPopoverValue: item.details,
                            editUsersPopoverValue: item.users,
                          });
                          this.closePopover(item.id);
                        }}
                      >
                        View
                      </EuiContextMenuItem>,
                      <EuiContextMenuItem
                        key="C"
                        icon="trash"
                        onClick={() => {
                          this.setState({ currentModal: 'delete', deleteSwitchOption: true });
                          this.closePopover(item.id);
                          this.setState({ popoverItem: item });
                        }}
                      >
                        Delete
                      </EuiContextMenuItem>,
                    ]}
                  />
                </EuiPopover>
              </EuiTableRowCell>
            );
          }
        }
        try {
          if (column.id === 'tag') {
            child = item.tag;
          } else if (column.id === 'users') {
            if (item.users) {
              if (item.users.toString().length > 80) {
                child = item.users.toString().slice(0, 78) + '...';
              } else {
                child = item.users.toString();
              }
            }
          } else if (column.id === 'details') {
            if (item.details) {
              if (item.details.length > 80) {
                child = item.details.slice(0, 78) + '...';
              } else {
                child = item.details;
              }
            }
          } else if (column.id === 'owner') {
            child = item.owner;
          } else if (column.id === 'timestamp') {
            child = item.timestamp;
          }
        } catch (err) {
          console.log(err);
          child = '';
        }

        return (
          <EuiTableRowCell
            key={column.id}
            align={column.alignment}
            textOnly={column.textOnly || false}
          >
            {child}
          </EuiTableRowCell>
        );
      });

      return (
        <EuiTableRow
          key={item.id}
          isSelected={this.isItemSelected(item.id)}
          isSelectable={true}
          hasActions={true}
        >
          {cells}
        </EuiTableRow>
      );
    };

    const rows = [];

    for (
      let itemIndex = this.state.firstItemIndex;
      itemIndex <= this.state.lastItemIndex;
      itemIndex++
    ) {
      const item = this.items[itemIndex];
      rows.push(renderRow(item));
    }

    return rows;
  }

  renderFooterCells() {
    const footers: ReactNode[] = [];

    const items = this.items;
    const pagination = {
      pageIndex: this.pager.getCurrentPageIndex(),
      pageSize: this.state.itemsPerPage,
      totalItemCount: this.pager.getTotalPages(),
    };

    this.columns.forEach((column) => {
      const footer = this.getColumnFooter(column, { items, pagination });
      if (column.mobileOptions && column.mobileOptions.only) {
        return; // exclude columns that only exist for mobile headers
      }

      if (footer) {
        footers.push(
          <EuiTableFooterCell key={`footer_${column.id}`} align={column.alignment}>
            {footer}
          </EuiTableFooterCell>
        );
      } else {
        footers.push(
          <EuiTableFooterCell key={`footer_empty_${footers.length - 1}`} align={column.alignment}>
            {undefined}
          </EuiTableFooterCell>
        );
      }
    });
    return footers;
  }

  getColumnFooter = (
    column: any,
    {
      items,
      pagination,
    }: {
      items: DataTag[];
      pagination: Pagination;
    }
  ) => {
    if (column.footer === null) {
      return null;
    }

    if (column.footer) {
      if (typeof column.footer === 'function') {
        return column.footer({ items, pagination });
      }
      return column.footer;
    }

    return undefined;
  };

  // Searching the Tags ************

  onSearchValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ searchValue: e.target.value });
  };

  onSearchSubmit = async () => {
    // console.log('search:' + this.state.searchValue);

    let searchVal = this.state.searchValue;
    let newTable: DataTag[] = this.props.dataTags.filter(function (obj) {
      return obj.tag.includes(searchVal);
    });

    // console.log(newTable);
    // this.props.updateTable([]);
    this.props.updateTable(newTable);
    this.closeModal();
    // this.props.searchTable();
  };

  //***************************** */

  // Modal Controls ***************

  showDeleteTagLoadingScreen = () => {
    this.setState({ currentModal: 'deleteDataTagLoadingScreen' });
  };
  closeModal = () => {
    this.setState({ currentModal: 'none' });
  };

  displayStatsPage = () => {
    this.setState({ currentModal: 'stats' });
  };

  getTagCountInDocuments = async () => {
    const core = getCore();
    let tagCountInDocuments: number = 0;

    let query: any = {
      match_phrase: {
        analyst_tags: this.state.popoverItem.tag,
      },
    };

    const getTagsCountInDocumentsOptions = {
      body: JSON.stringify({
        index: '*',
        query: JSON.stringify(query),
      }),
    };

    //get the count of how many of the tags exist in the indexes
    await core.http
      .post('/api/spitting_alpaca/gettagcountindocuments', getTagsCountInDocumentsOptions)
      .then(async (res: any) => {
        console.log(res);
        tagCountInDocuments = res.response.body.count;
      });

    return tagCountInDocuments;
  };

  confirmDeleteTag = async () => {
    const core = getCore();
    const batchSize: number = 5000;
    let tagCountInDocuments: number = 0;
    let arrTag: string[] = [];
    arrTag.push(this.state.popoverItem.tag);

    let query: any = {
      match_phrase: {
        analyst_tags: this.state.popoverItem.tag,
      },
    };

    const batchDeleteOptions = {
      body: JSON.stringify({
        tags: arrTag,
        index: '*',
        batchSize: batchSize,
        query: JSON.stringify(query),
      }),
    };

    const deleteTagEntity = {
      body: JSON.stringify({
        tag: this.state.popoverItem.tag,
        owner: this.state.popoverItem.owner,
      }),
    };

    //set the loading screen

    //get the count and set up the variables for displaying the batches
    let startTime = Date.now();
    tagCountInDocuments = await this.getTagCountInDocuments();
    this.setState({ docCount: tagCountInDocuments });
    let batchCount = Math.ceil(tagCountInDocuments / batchSize);
    this.setState({ batchSize: batchCount });
    let count: number = 0;

    this.showDeleteTagLoadingScreen();

    for (let i = tagCountInDocuments; i > 0; ) {
      //batch the delete api calls and delete the results from the total tag count
      this.setState({ currentBatch: count });

      await core.http
        .post('/api/spitting_alpaca/batchdeletetags', batchDeleteOptions)
        .then(async (res: any) => {
          console.log(res);
        });
      count++;
      i -= batchSize;
    }
    //TODO
    //if the switch option is true delete the entire data tag from the
    if (this.state.deleteSwitchOption) {
      await core.http
        .post('/api/spitting_alpaca/deletetagentity', deleteTagEntity)
        .then(async (res: any) => {
          console.log(res);
          let id = this.state.popoverItem.id;
          let newTable: DataTag[] = this.props.completeDataTagsList.filter(function (tag) {
            return tag.id !== id;
          });
          console.log('DATA TAGS');
          console.log(this.props.completeDataTagsList);
          console.log('Delete Data Tag');
          console.log(this.state.popoverItem.id);
          console.log(this.state.dataTags);
          console.log(newTable);
          this.props.updateTable(newTable);
        });
    }
    this.setState({ executionTime: (Date.now() - startTime) / 1000 });

    this.displayStatsPage();
    //call the get tags api
  };

  onEditDetailsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    this.setState({ editDetailsPopoverValue: e.target.value });
  };

  onCreateOption = (searchValue: any) => {
    if (!isValid(searchValue) || searchValue == this.props.username) {
      // Return false to explicitly reject the user's input.
      return false;
    }

    const newOption = {
      label: searchValue,
    };

    // Select the option.
    this.setSelectedOptions([...this.state.selectedOptions, newOption]);
  };

  onAdditionalUserChange = (selectedOptions: { label: string }[]) => {
    this.setSelectedOptions(selectedOptions);
    this.setInvalid(false);
  };

  onAdditionalUserSearchChange = (searchValue: any) => {
    if (!searchValue) {
      this.setInvalid(false);

      return;
    }

    this.setInvalid(!isValid(searchValue));
  };

  updateDataTag = async () => {
    const core = getCore();
    let options = {
      body: JSON.stringify({
        updateID: this.state.popoverItem._id,
        tag: this.state.popoverItem.tag,
        details: this.state.editDetailsPopoverValue,
        owner: this.state.popoverItem.owner,
        users: this.selectedOptionsToStringArray(this.state.selectedOptions),
        timestamp: this.state.popoverItem.timestamp,
      }),
    };

    await core.http
      .post('/api/spitting_alpaca/updatedatatag', options)
      .then(async (res: any) => {
        //console log the results
        console.log(res);

        //handle an empty result
        if (res.status == 200) {
          //toast the user the success
          this.props.toastMessageSuccess('Data Tag Updated Successfully', 3000);

          //build the new array and update the list
          let newTable: DataTag[] = this.props.dataTags;
          let idOfUpdatedDataTag: number = this.props.dataTags.indexOf(this.state.popoverItem);

          newTable[idOfUpdatedDataTag].details = this.state.editDetailsPopoverValue;
          newTable[idOfUpdatedDataTag].users = this.selectedOptionsToStringArray(
            this.state.selectedOptions
          );
          // console.log(newTable);
          this.props.updateTable(newTable);
        } else {
          this.props.toastMessageWarning('Data Tag Not Updated', 3000);
        }
      })
      .catch((err) => {
        this.props.toastMessageWarning(err, 3000);
        console.log(err);
      });
    this.closeModal();
  };

  //bc of the combobox format we need to occasionally go back and forth between a string array and an object array like this {label:string}[]
  createSelectedOptions = (values: string[]) => {
    if (values) {
      let retval: { label: string }[] = [];

      values.forEach((item) => {
        retval.push({ label: item });
      });

      return retval;
    } else {
      return [];
    }
  };

  //bc of the combobox format we need to occasionally go back and forth between a string array and an object array like this {label:string}[]
  selectedOptionsToStringArray = (so: { label: string }[]) => {
    let retVal: string[] = [];

    so.forEach((option) => {
      retVal.push(option.label);
    });
    return retVal;
  };

  pointlessFunction = () => {
    // the modal component needs a close function but the way the "deleteDataTagLoadingScreen" is setup you dont want the user to be able to click out of it
    // so i came up with this terrible idea to create a pointless function so when the user clicks the close button nothing happens and the modal is closed after the api call completes like i want it too
    // wcgw
  };

  onDeleteTagSwitchChange = (e: EuiSwitchEvent) => {
    this.setState({ deleteSwitchOption: e.target.checked });
  };
  //***************************** */

  render() {
    // console.log('Table Render');
    // console.log(this.props.dataTags);

    let modal;
    switch (this.state.currentModal) {
      case 'edit':
        modal = (
          <EuiModal
            style={{ width: 500 }}
            onClose={this.closeModal}
            initialFocus="[name=popswitch]"
            maxWidth={500}
          >
            <EuiModalHeader>
              <EuiModalHeaderTitle>Editing: {this.state.popoverItem.tag}</EuiModalHeaderTitle>
            </EuiModalHeader>

            <EuiModalBody>
              <dl className="eui-textBreakAll">
                <dt>
                  <b>Owner: </b>
                  {this.state.popoverItem.owner}
                </dt>
                <dt>
                  <b>Timestamp: </b>
                  {this.state.popoverItem.timestamp}
                </dt>

                <dt>
                  <b> Details: </b>
                  <EuiTextArea
                    placeholder="Details"
                    aria-label="edit-details-popover--id"
                    value={this.state.editDetailsPopoverValue}
                    onChange={(e) => this.onEditDetailsChange(e)}
                  />
                </dt>

                <dt>
                  <b> Users: </b>
                  <EuiComboBox
                    noSuggestions
                    placeholder="Enter username/s"
                    selectedOptions={this.state.selectedOptions}
                    onCreateOption={this.onCreateOption}
                    onChange={this.onAdditionalUserChange}
                    onSearchChange={this.onAdditionalUserSearchChange}
                    isInvalid={this.state.isInvalid}
                  />
                </dt>
              </dl>
            </EuiModalBody>

            <EuiModalFooter>
              <EuiButtonEmpty onClick={this.closeModal}>Exit</EuiButtonEmpty>
              <EuiButton onClick={this.updateDataTag} fill>
                Submit
              </EuiButton>
            </EuiModalFooter>
          </EuiModal>
        );
        break;
      case 'view':
        modal = (
          <EuiModal
            style={{ width: 500 }}
            onClose={this.closeModal}
            initialFocus="[name=popswitch]"
          >
            <EuiModalHeader>
              <EuiModalHeaderTitle>Viewing: {this.state.popoverItem.tag}</EuiModalHeaderTitle>
            </EuiModalHeader>

            <EuiModalBody>
              <dl className="eui-textBreakAll">
                <dt>
                  <b>Owner: </b>
                  {this.state.popoverItem.owner}
                </dt>
                <dt>
                  <b>Timestamp:</b> {this.state.popoverItem.timestamp}
                </dt>

                <dt>
                  <b>Details:</b>
                  <dd
                    style={this.state.popoverItem.details ? { color: 'white' } : { color: 'gray' }}
                  >
                    {this.state.popoverItem.details
                      ? this.state.popoverItem.details
                      : '(Field empty)'}
                  </dd>
                </dt>

                <dt>
                  <b> Users: </b>
                  <dd style={this.state.popoverItem.users ? { color: 'white' } : { color: 'gray' }}>
                    {this.state.popoverItem.users
                      ? this.state.popoverItem.users.toString()
                      : '(Field Empty)'}
                  </dd>
                </dt>
              </dl>
            </EuiModalBody>

            <EuiModalFooter></EuiModalFooter>
          </EuiModal>
        );
        break;
      case 'delete':
        modal = (
          <EuiModal
            style={{ width: 600 }}
            onClose={this.closeModal}
            initialFocus="[name=popswitch]"
          >
            <EuiModalHeader>
              <EuiModalHeaderTitle>
                Delete Data Tag: {this.state.popoverItem.tag}
              </EuiModalHeaderTitle>
            </EuiModalHeader>

            <EuiModalBody>
              <p>
                ({this.state.popoverItem.tag}) data tag will be permanently delete across all
                indexes.
              </p>
            </EuiModalBody>

            <EuiModalFooter>
              <EuiFlexGroup>
                <EuiFlexItem>
                  <EuiSwitch
                    label={this.state.deleteSwitchOption ? 'Complete Delete' : 'Delete Docs'}
                    checked={this.state.deleteSwitchOption}
                    onChange={(e) => {
                      this.onDeleteTagSwitchChange(e);
                    }}
                  />
                </EuiFlexItem>

                <EuiFlexItem>
                  <EuiIconTip
                    content="'Complete Delete' removes the Data Tag and all corresponding tags in documents, 
            'Delete Docs' removes data tags from all corresponding tags in documents but keeps the original Data Tag"
                    position="left"
                  />
                </EuiFlexItem>

                <EuiFlexItem></EuiFlexItem>
              </EuiFlexGroup>

              <EuiButtonEmpty onClick={this.closeModal}>Exit</EuiButtonEmpty>
              <EuiButton color="danger" onClick={this.confirmDeleteTag} fill>
                Delete Tag
              </EuiButton>
            </EuiModalFooter>
          </EuiModal>
        );
        break;
      case 'deleteDataTagLoadingScreen':
        modal = (
          <div>
            <EuiModal onClose={this.pointlessFunction} initialFocus="[name=popswitch]">
              <EuiModalBody>
                <EuiEmptyPrompt
                  icon={<EuiLoadingLogo logo="logoKibana" size="xl" />}
                  title={<h2>Deleting {this.state.popoverItem.tag} from indexes</h2>}
                />
              </EuiModalBody>

              <EuiModalFooter>
                {this.state.currentBatch} / {this.state.batchSize} Batches Complete
              </EuiModalFooter>
            </EuiModal>
          </div>
        );
        break;
      case 'stats':
        modal = (
          <EuiModal onClose={this.closeModal}>
            <EuiModalBody>
              <EuiEmptyPrompt
                iconType={'tag'}
                title={<h2>Tags Deleted</h2>}
                body={
                  <p>
                    <dl>
                      <dt>Append Stats:</dt>
                      <dd>Execution Time: {this.state.executionTime} seconds</dd>
                      <dd>Documents Present: {this.state.docCount}</dd>
                    </dl>

                    <dl className="eui-definitionListReverse">
                      <dt>Deleted Tags:</dt>
                      <dd>
                        {this.state.selectedOptions.map((item) => (
                          <li>{item.label}</li>
                        ))}
                      </dd>
                    </dl>
                  </p>
                }
              />
            </EuiModalBody>
            <EuiModalFooter>
              <EuiButton onClick={this.closeModal}>Close</EuiButton>
            </EuiModalFooter>
          </EuiModal>
        );
        break;
      case 'none':
        break;
      default:
        break;
    }

    let loading = (
      <div>
        <EuiEmptyPrompt
          icon={<EuiLoadingLogo logo="logoKibana" size="xl" />}
          title={<h2>Loading Data Tags</h2>}
        />
      </div>
    );

    let optionalActionButtons;
    const exampleId = 'example-id';

    if (!!this.areAnyRowsSelected()) {
      optionalActionButtons = (
        <EuiFlexItem grow={false}>
          <EuiButton color="danger">Delete selected</EuiButton>
        </EuiFlexItem>
      );
    }

    return (
      <>
        <EuiSpacer size="m" />
        <EuiFlexGroup gutterSize="m">{optionalActionButtons}</EuiFlexGroup>

        {this.state.tableIsLoading ? (
          loading
        ) : (
          <>
            <EuiFlexGroup gutterSize="s">
              {/* <EuiFlexItem style={{ width: 460 }}>
                <EuiFieldSearch
                  value={this.state.searchValue}
                  onChange={(e) => this.onSearchValueChange(e)}
                  isClearable={true}
                  fullWidth
                  placeholder="Search by Tag"
                />
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButton title="Search" onClick={this.onSearchSubmit}>
                  Search
                </EuiButton>
              </EuiFlexItem> */}
            </EuiFlexGroup>
            <EuiSpacer size="m" />
            <EuiTableHeaderMobile>
              <EuiFlexGroup responsive={false} justifyContent="spaceBetween" alignItems="baseline">
                <EuiFlexItem grow={false}>{this.renderSelectAll(true)}</EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiTableSortMobile items={this.getTableMobileSortItems()} />
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiTableHeaderMobile>
            <EuiTable id={exampleId}>
              <EuiTableHeader>{this.renderHeaderCells()}</EuiTableHeader>

              {this.props.dataTags.length == 0 ? (
                <EuiText>No Items</EuiText>
              ) : (
                <EuiTableBody>{this.renderRows()}</EuiTableBody>
              )}

              <EuiTableFooter>{this.renderFooterCells()}</EuiTableFooter>
            </EuiTable>
            <EuiSpacer size="m" />
            <EuiTablePagination
              aria-label="Custom EuiTable demo"
              aria-controls={exampleId}
              activePage={this.pager.getCurrentPageIndex()}
              itemsPerPage={this.state.itemsPerPage}
              itemsPerPageOptions={[5, 10, 20]}
              pageCount={this.pager.getTotalPages()}
              onChangeItemsPerPage={this.onChangeItemsPerPage}
              onChangePage={this.onChangePage}
            />
            {modal}
          </>
        )}
      </>
    );
  }
}
