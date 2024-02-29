/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import React, { Component } from 'react';
import {
  EuiText,
  EuiCommentProps,
  EuiAvatar,
  EuiSpacer,
  EuiTitle,
  EuiHorizontalRule,
  EuiFlexItem,
  EuiButton,
  EuiTextArea,
  EuiBasicTable,
  EuiFieldSearch,
  Direction,
  EuiTableFieldDataColumnType,
  Pagination,
  EuiCard,
  EuiIcon,
  EuiFlexGroup,
  EuiModal,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiModalBody,
  EuiModalFooter,
  EuiComboBox,
  EuiButtonEmpty,
  EuiFieldText,
  EuiConfirmModal,
  EuiBadge,
  EuiAccordion,
  EuiIconTip,
  EuiSwitch,
  EuiSwitchEvent,
  EuiComboBoxOptionOption,
} from '@elastic/eui';
import { ElasticSearchHit } from '../../../../../../src/plugins/discover/public/types';
import { getCore, getCurrentUser } from '../../../services';
import { IndexPattern } from '../../../../../../src/plugins/data/public';
import { CoreStart } from 'kibana/public';
import { AnalystTag } from '../../../../common/types';
import ReactDOM from 'react-dom';
import { isValid } from '../../../../common/helpers';

const no_text = (
  <EuiText size="s">
    <p>There are currently no Data Tags for this entry.</p>
  </EuiText>
);

const loading_text = (
  <EuiText size="s">
    <p>One moment while we check for Data Tags</p>
  </EuiText>
);

const loading_tags: EuiCommentProps[] = [
  {
    username: 'Moon Dragon',
    event: 'System Message',
    timelineIcon: <EuiAvatar size="l" name="Moon Dragon" />,
    children: loading_text,
  },
];

const text = (
  <EuiText>
    <p>
      Add Additional Users
      <EuiIconTip
        type="iInCircle"
        color="subdued"
        content={<span>Users added will be able to use/delete the Data Tag after creation.</span>}
        iconProps={{
          className: 'eui-alignTop',
        }}
      />
    </p>
  </EuiText>
);

export interface DataTag {
  tag: string;
  details: string;
  owner: string;
  users: string[];

  timestamp: string;
}

interface DVDTProps {
  hit: ElasticSearchHit;
  indexPattern?: IndexPattern;
  flattened?: Record<string, any>;
  refreshDashboardTags?: () => void;
}

interface DVDTState {
  core: CoreStart;
  tags: EuiCommentProps[];
  analystTags: AnalystTag[];
  tableRows: any[];
  responseData: any[];
  tableColumns: any[];
  pageIndex: number;
  pageSize: number;
  sortField: any;
  sortDirection: Direction;
  tableIsLoading: boolean;

  sorting: any;
  searchValue: string;
  currentModal: string;
  tagInvalid: boolean;
  createTagField: string;
  createDetailsField: string;
  hideFormError: boolean;
  formErrorMessage: string;
  currentTags: string[];
  docTags: string[];
  tagMappings: DataTag[];
  createConfirm: boolean;
  addConfirm: boolean;
  deleteConfirm: boolean;
  addOptions: EuiComboBoxOptionOption[];
  addSelected: EuiComboBoxOptionOption[];
  deleteOptions: EuiComboBoxOptionOption[];
  deleteSelected: EuiComboBoxOptionOption[];
  isInvalid: boolean;
  //these are the additional users added to the data tag
  selectedOptions: { label: string }[];
  username: string;
  addOrCreateTagSwitchOption: boolean;
}

export class DocViewAnalystTags extends Component<DVDTProps, DVDTState> {
  constructor(props: DVDTProps) {
    super(props);

    const core = getCore();

    this.state = {
      core,
      tags: loading_tags,
      analystTags: [],
      tableRows: [],
      responseData: [],
      tableColumns: [],
      pageIndex: 0,
      pageSize: 10,
      sortField: undefined,
      sortDirection: 'asc',
      tableIsLoading: true,

      sorting: this.createSorting(),
      searchValue: '',
      currentModal: 'none',
      tagInvalid: false,
      createTagField: '',
      createDetailsField: '',
      hideFormError: true,
      formErrorMessage: '',
      currentTags: [],
      docTags: [],
      tagMappings: [],
      createConfirm: false,
      addConfirm: false,
      deleteConfirm: false,
      addOptions: [],
      addSelected: [],
      deleteOptions: [],
      deleteSelected: [],
      isInvalid: false,
      selectedOptions: [],
      username: '',
      addOrCreateTagSwitchOption: true,
    };

    //Call functions to initialize table
    this.getUser();
    this.getTagsByDoc();
    this.getAllTags();
  }

  //SETTERS
  setTags = (t: EuiCommentProps[]) => this.setState({ tags: t });
  setAnalystTags = (at: AnalystTag[]) => this.setState({ analystTags: at });
  setPageIndex = (pageIndex: number) => {
    this.setState({ pageIndex: pageIndex });
  };
  setPageSize = (pageSize: number) => {
    this.setState({ pageSize: pageSize });
  };
  setSortField = (sortField: any) => {
    this.setState({ sortField: sortField });
  };
  setSortDirection = (sortDirection: Direction) => {
    this.setState({ sortDirection: sortDirection });
  };
  setTagInvalid = (tagInvalid: boolean) => {
    this.setState({ tagInvalid: tagInvalid });
  };
  setFormError = (formErrorMessage: string) => {
    this.setState({ formErrorMessage: formErrorMessage });
    this.setState({ hideFormError: false });
  };
  setInvalid = (value: boolean) => {
    this.setState({ isInvalid: value });
  };
  setSelectedOptions = (list: { label: string }[]) => {
    this.setState({ selectedOptions: list });
  };
  setAppendOrDeleteSwitchOption = (value: boolean) => {
    this.setState({ addOrCreateTagSwitchOption: value });
  };

  //CLEAR FORMS
  clearFormError = () => {
    this.setState({ formErrorMessage: '' });
    this.setState({ hideFormError: true });
  };
  clearModalForm = () => {
    this.setState({
      createTagField: '',
      createDetailsField: '',
      selectedOptions: [],
      addSelected: [],
      deleteSelected: [],
    });
  };

  //Trigger toast message success
  toastMessageSuccess = (message: string | JSX.Element, timer: number) => {
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

  //Trigger toast message warning
  toastMessageWarning = (message: string | JSX.Element, timer: number) => {
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

  componentDidUpdate(prevProps, prevState) {
    if (prevState.searchValue !== this.state.searchValue) {
      this.setState({ pageIndex: 0 });
    }
  }

  //Get all document tags and set table data and form options
  getTagsByDoc = () => {
    var options = {
      body: JSON.stringify({
        hit: this.props.hit,
        index: this.props.hit._index,
        flattenedhit: this.props.flattened
          ? this.props.flattened
          : this.props.indexPattern!.flattenHit(this.props.hit),
      }),
    };

    this.state.core.http
      .post('/api/spitting_alpaca/gettagsbydoc', options)
      .then(async (res: any) => {
        //Check for empty items
        if (res.response.length < 1) {
          this.setState({ responseData: res.response });
          this.setState({ tableIsLoading: false });
          this.setState({ tableRows: [] });
          this.setState({ tableColumns: [] });

          //Otherwise, handle the response
        } else {
          this.setState({ responseData: res.response });
          this.createColumns();
          this.createRows();
          this.setState({ tableIsLoading: false });
          let tempTags: any = [];
          let tempOptions: EuiComboBoxOptionOption<any>[] = [];

          //Parse results to create docTags and deleteOptions
          for (let i = 0; i < res.response.length; i++) {
            for (let x = 0; x < res.response[i].length; x++) {
              let keys = Object.keys(res.response[i][x]);
              keys.forEach((key) => {
                if (key === 'tag') {
                  tempTags.push(res.response[i][x][key]);
                  tempOptions.push({ label: res.response[i][x][key] });
                }
              });
            }
          }

          this.setState({ docTags: tempTags });
          this.setState({ deleteOptions: tempOptions });
        }
      })
      .catch(() => this.getTagsByDoc());
  };

  //Get all data tags API call and set form options
  async getAllTags() {
    await this.delay(1000);
    const core = getCore();

    await core.http
      .post('/api/spitting_alpaca/getalltags')
      .then(async (res: any) => {
        //Check for empty items
        if (res.response.length < 1) {
          this.setState({ currentTags: [] });
          this.setState({ addOptions: [] });
          this.setState({ tagMappings: [] });
        } else {
          let tempTags: any = [];
          let tempOptions: EuiComboBoxOptionOption<any>[] = [];
          let deleteOptions = this.state.deleteOptions;
          let tempMappings: DataTag[] = [];

          //Parse response into tagMappings object
          for (let i = 0; i < res.response.length; i++) {
            let tempObj: any = [];
            tempObj['users'] = [];
            for (let x = 0; x < res.response[i].length; x++) {
              let keys = Object.keys(res.response[i][x]);
              keys.forEach((key) => {
                tempObj[key] = res.response[i][x][key];
              });
            }
            tempMappings.push(Object.assign({}, tempObj));
          }

          tempMappings.forEach((mapping) => {
            //Push all found tags to currentTags
            tempTags.push(mapping.tag);

            //Check if tag exists in docTags
            let tagMatch = this.state.docTags.some((e) => {
              return e === mapping.tag;
            });

            let userMatch = mapping.users.some((e) => {
              return e === this.state.username;
            });

            //Push to addOptions if not in docTags && matches owner or user
            if (!tagMatch && (mapping.owner === this.state.username || userMatch)) {
              tempOptions.push({ label: mapping.tag });
            }
            //Remove from deleteOptions if not owner or user
            else {
              if (mapping.owner != this.state.username && !userMatch) {
                let index = deleteOptions.findIndex((element) => element.label === mapping.tag);
                if (index !== -1) {
                  deleteOptions.splice(index, 1);
                }
              }
            }
          });

          this.setState({ currentTags: tempTags });
          this.setState({ addOptions: tempOptions });
          this.setState({ tagMappings: tempMappings });
        }
      })
      .catch((err) => console.log(err));

    return;
  }

  onCreateSubmit = () => {
    //Check for empty tag
    if (this.state.createTagField.length < 1) {
      this.setTagInvalid(true);
      this.setFormError('Field required: Tag name');
    } else if (!this.state.tagInvalid) {
      this.setState({ createConfirm: true });
    }
  };

  //API to create new tag when the "Looks Good" button is confirmed
  onCreateConfirm = () => {
    const core = getCore();
    const user = getCurrentUser();

    //Create parameters for API
    let tag = JSON.stringify({
      username: user.username,
      tag: this.state.createTagField,
      details: this.state.createDetailsField,
      users: this.selectedOptionsToStrings(), //selectedOptions needs to be an array of object {label: string} we have to convert these before sending them
    });

    //Execute API call
    core.http
      .put('/api/spitting_alpaca/createtag', { body: JSON.stringify(tag) })
      .then((res: any) => {
        //API success
        if (res.status.statusCode == 200) {
          this.toastMessageSuccess(
            <EuiText>
              Tag <EuiBadge color="primary">{this.state.createTagField}</EuiBadge> Created
              Successfully
            </EuiText>,
            3000
          );

          //Add the tag to the document
          if (this.state.addOrCreateTagSwitchOption == true) {
            let tag = this.state.createTagField;
            let updateParams = JSON.stringify({
              id: this.props.hit._id,
              tag: [this.state.createTagField],
              index: this.props.hit._index,
            });

            //Add tag API call
            core.http
              .put('/api/spitting_alpaca/addtag', { body: JSON.stringify(updateParams) })
              .then(() => {
                this.getTagsByDoc();
                this.getAllTags();
              })

              //API error
              .catch(() => {
                this.toastMessageWarning(
                  <EuiText>
                    Failed to add Tag <EuiBadge color="primary">{tag}</EuiBadge> to document
                  </EuiText>,
                  3000
                );
              });
            //Otherwise don't add tag to document and only to addOptions
          } else {
            let tempItems = this.state.addOptions;
            tempItems.push({ label: this.state.createTagField });
            this.setState({ addOptions: tempItems });
          }

          //Add tag to currentTags
          this.state.currentTags.push(this.state.createTagField);

          this.closeModal();
          this.closeSubmodal();

          //API failure
        } else {
          this.toastMessageWarning(
            <EuiText>
              Failed to add Tag
              <EuiBadge color="primary">{this.state.createTagField}</EuiBadge>
            </EuiText>,
            3000
          );
        }
      })

      //API error
      .catch(() => {
        this.toastMessageWarning(
          <EuiText>
            Failed to add Tag
            <EuiBadge color="primary">{this.state.createTagField}</EuiBadge>
          </EuiText>,
          3000
        );
      });
  };

  onAddSubmit = () => {
    //Check for empty tag
    if (this.state.addSelected.length < 1) {
      this.setTagInvalid(true);
      this.setFormError('No tags selected');
    } else if (!this.state.tagInvalid) {
      this.setState({ addConfirm: true });
    }
  };

  //API to add tag when the "Looks Good" button is confirmed
  onAddConfirm = () => {
    this.addTag();
  };

  async addTag() {
    const core = getCore();

    let selectedOptions: any = [];
    // let tempOptions = this.state.addOptions;

    for (let item of this.state.addSelected) {
      selectedOptions.push(item.label);
    }

    //Parameters for API
    let updateParams = JSON.stringify({
      id: this.props.hit._id,
      tag: selectedOptions,
      index: this.props.hit._index,
    });

    await core.http
      .put('/api/spitting_alpaca/addtag', { body: JSON.stringify(updateParams) })
      .then(() => {
        for (let item of selectedOptions) {
          this.toastMessageSuccess(
            <EuiText>
              Tag <EuiBadge color="primary">{item}</EuiBadge> Added Successfully
            </EuiText>,
            3000
          );

          //   let index = tempOptions.findIndex((element) => element.label === item);
          //   if (index !== -1) {
          //     tempOptions.splice(index, 1);
          //   }
          // }

          // while (
          //   this.state.addOptions.findIndex((element) => element.label === selectedOptions[0]) != -1
          // ) {
          //   this.getTagsByDoc();
          //   this.getAllTags();
          // }

          // this.setState({ addOptions: tempOptions });
          this.closeModal();
          this.closeSubmodal();
          this.getTagsByDoc();
          this.getAllTags();
        }
      })

      //API error
      .catch(() => {
        this.toastMessageWarning(
          <EuiText>
            Failed to add Tag <EuiBadge color="primary">{this.state.createTagField}</EuiBadge> to
            document
          </EuiText>,
          3000
        );
      });
  }

  onDeleteSubmit = () => {
    //Check for empty tag
    if (this.state.deleteSelected.length < 1) {
      this.setTagInvalid(true);
      this.setFormError('No tags selected');
    } else if (!this.state.tagInvalid) {
      this.setState({ deleteConfirm: true });
    }
  };

  //API to delete tag when the "Looks Good" button is confirmed
  onDeleteConfirm = () => {
    this.deleteTags();
  };

  async deleteTags() {
    const core = getCore();

    let selectedOptions: any = [];

    for (let item of this.state.deleteSelected) {
      selectedOptions.push(item.label);
    }

    //Parameters for API
    let updateParams = JSON.stringify({
      id: this.props.hit._id,
      tag: selectedOptions,
      index: this.props.hit._index,
    });

    await core.http
      .put('/api/spitting_alpaca/deletetagfromdoc', { body: JSON.stringify(updateParams) })
      .then(() => {
        for (let item of selectedOptions) {
          this.toastMessageSuccess(
            <EuiText>
              Tag <EuiBadge color="primary">{item}</EuiBadge> Deleted Successfully
            </EuiText>,
            3000
          );
        }

        this.closeModal();
        this.closeSubmodal();
        this.getTagsByDoc();
        this.getAllTags();
      })

      //API error
      .catch(() => {
        this.toastMessageWarning(
          <EuiText>
            Failed to delete Tag <EuiBadge color="primary">{this.state.createTagField}</EuiBadge>{' '}
            from document
          </EuiText>,
          3000
        );
      });
  }

  delay(time: number) {
    return new Promise((resolve) => setTimeout(resolve, time));
  }

  // createActions = () => {
  //   return [
  //     {
  //       name: 'Delete',
  //       description: 'Delete this tag',
  //       icon: 'trash',
  //       color: 'danger',
  //       type: 'icon',
  //       onClick: (tag: any) => this.deleteTag(tag),
  //       isPrimary: true,
  //       'data-test-subj': 'action-delete',
  //     },
  //   ];
  // };

  createSorting = () => {
    return {
      sort: {
        field: undefined,
        direction: 'asc',
      },
    };
  };

  //Return column index for an item
  getColumnIndex = (columns: EuiTableFieldDataColumnType<any>[], name: string) => {
    for (let i = 0; i < columns.length; i++) {
      if (columns[i].name == name) {
        return i as number;
      }
    }
    return -1;
  };

  //Create column data for the table
  createColumns = () => {
    let tempColumns: EuiTableFieldDataColumnType<any>[] = [];
    let withActions: any[] = [];
    for (let i = 0; i < this.state.responseData.length; i++) {
      for (let x = 0; x < this.state.responseData[i].length; x++) {
        let keys = Object.keys(this.state.responseData[i][x]);

        keys.forEach((key) => {
          if (tempColumns.findIndex((element) => element.name === key) === -1) {
            tempColumns.push({
              field: key as string,
              name: key,
              //sortable: (item) => this.columnSort(item),
              sortable: true,
              truncateText: true,
              //footer: <span>{key}</span>,
            });
          }
        });
      }
    }

    //Splices are used to manually order the columns
    tempColumns.splice(this.getColumnIndex(tempColumns, '_index'), 1);
    tempColumns.splice(this.getColumnIndex(tempColumns, 'username'), 1);
    tempColumns.splice(
      0,
      0,
      tempColumns.splice(this.getColumnIndex(tempColumns, 'fieldval'), 1)[0]
    );
    tempColumns.splice(
      0,
      0,
      tempColumns.splice(this.getColumnIndex(tempColumns, 'fieldname'), 1)[0]
    );
    tempColumns.splice(0, 0, tempColumns.splice(this.getColumnIndex(tempColumns, 'tag'), 1)[0]);

    withActions = tempColumns;

    //Add actions to the table
    // withActions.push({
    //   name: 'Actions',
    //   actions: this.state.actions,
    // });

    this.setState({ tableColumns: withActions });
  };

  //Create row data for the table
  createRows = () => {
    let tempRows: any = [];

    //Parse row data and format into table readable object
    for (let i = 0; i < this.state.responseData.length; i++) {
      let tempObj: any = [];
      for (let x = 0; x < this.state.responseData[i].length; x++) {
        let keys = Object.keys(this.state.responseData[i][x]);
        keys.forEach((key) => {
          tempObj[key] = this.state.responseData[i][x][key];
        });
      }
      tempRows.push(Object.assign({}, tempObj));
    }

    //Sort row data on tag field
    tempRows.sort((a, b) => {
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

    this.setState({ tableRows: tempRows });
  };

  //Handle changes of sort direction or page index/size
  onTableChange = ({ page = {}, sort = {} }) => {
    const { index: pageIndex, size: pageSize } = page;
    const { field: sortField, direction: sortDirection } = sort;

    switch (sortField) {
      case 'timestamp':
        this.sortDate(sortDirection);
        break;
      case '_score':
        this.sortNum(sortField, sortDirection);
        break;
      case 'rawtime':
        this.sortNum(sortField, sortDirection);
        break;
      case 'applytoall':
        this.sortBool(sortField, sortDirection);
        break;
      default:
        this.sortAZ(sortField, sortDirection);
        break;
    }

    this.setPageIndex(pageIndex);
    this.setPageSize(pageSize);
    this.setSortField(sortField);
    this.setSortDirection(sortDirection);
    this.setState({ sorting: { sort: { field: sortField, direction: sortDirection } } });
  };

  parseDate = (date) => {
    let dt = new Date();

    let parts = date.split(/[\s ]/);
    dt.setFullYear(parseInt(parts[3], 10));
    dt.setMonth(parseInt(this.getMonth(parts[1]), 10));
    dt.setDate(parseInt(parts[2], 10));

    parts = parts[4].split(/:/);
    dt.setHours(parseInt(parts[0], 10));
    dt.setMinutes(parseInt(parts[1], 10));
    dt.setSeconds(parseInt(parts[2], 10));

    return dt;
  };

  getMonth = (month) => {
    enum Months {
      Jan = 0,
      Feb,
      Mar,
      Apr,
      May,
      Jun,
      Jul,
      Aug,
      Sep,
      Oct,
      Nov,
      Dec,
    }

    return Months[month];
  };

  sortDate = (sortDirection) => {
    if (sortDirection == 'asc') {
      this.state.tableRows.sort((a, b) => {
        return this.parseDate(a.timestamp).getTime() - this.parseDate(b.timestamp).getTime();
      });
    }
    if (sortDirection == 'desc') {
      this.state.tableRows.sort((a, b) => {
        return this.parseDate(b.timestamp).getTime() - this.parseDate(a.timestamp).getTime();
      });
    }
  };

  sortNum = (sortField, sortDirection) => {
    if (sortDirection == 'asc') {
      this.state.tableRows.sort((a, b) => {
        return a[sortField] - b[sortField];
      });
    }
    if (sortDirection == 'desc') {
      this.state.tableRows.sort((a, b) => {
        return b[sortField] - a[sortField];
      });
    }
  };

  sortBool = (sortField, sortDirection) => {
    if (sortDirection == 'asc') {
      this.state.tableRows.sort((a, b) => {
        let la = a[sortField],
          lb = b[sortField];
        if (la === undefined || lb === undefined) {
          return 0;
        } else {
          if (la == true && lb == false) {
            return -1;
          }
          if (la == false && lb == true) {
            return 1;
          }
        }
        return 0;
      });
    }
    if (sortDirection == 'desc') {
      this.state.tableRows.sort((a, b) => {
        let la = a[sortField],
          lb = b[sortField];
        if (la === undefined || lb === undefined) {
          return 0;
        } else {
          if (la == true && lb == false) {
            return 1;
          }
          if (la == false && lb == true) {
            return -1;
          }
        }
        return 0;
      });
    }
  };

  sortAZ = (sortField, sortDirection) => {
    if (sortDirection == 'asc') {
      this.state.tableRows.sort((a, b) => {
        let la = a[sortField]?.toLocaleLowerCase(),
          lb = b[sortField]?.toLocaleLowerCase();
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
    }
    if (sortDirection == 'desc') {
      this.state.tableRows.sort((a, b) => {
        let la = a[sortField]?.toLocaleLowerCase(),
          lb = b[sortField]?.toLocaleLowerCase();
        if (la === undefined || lb === undefined) {
          return 0;
        } else {
          if (la > lb) {
            return -1;
          }
          if (la < lb) {
            return 1;
          }
        }
        return 0;
      });
    }
  };

  onSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ searchValue: e.target.value });
  };

  filterRow = (row) => {
    let res = false;

    Object.values(row).forEach((item) => {
      let str = String(item).toLowerCase();
      if (str.includes(this.state.searchValue.toLowerCase())) {
        res = true;
      }
    });
    return res;
  };

  onCreateClick = () => {
    this.setState({ currentModal: 'create' });
  };

  onExistingClick = () => {
    this.setState({ currentModal: 'existing' });
  };

  onDeleteClick = () => {
    this.setState({ currentModal: 'delete' });
  };

  closeModal = () => {
    this.setState({ currentModal: 'none' });
    this.clearModalForm();
    this.clearFormError();
    this.setTagInvalid(false);
  };

  closeSubmodal = () => {
    this.setState({
      createConfirm: false,
      addConfirm: false,
      deleteConfirm: false,
      tagInvalid: false,
      formErrorMessage: '',
    });
  };

  onChangeCreateTagField = (e) => {
    this.setTagInvalid(false);
    this.clearFormError();
    this.checkTag(e.target.value);
    this.setState({ createTagField: e.target.value });
  };

  onChangeCreateDetailsField = (e) => {
    this.setState({ createDetailsField: e.target.value });
  };

  onChangeAdd = (e) => {
    this.setTagInvalid(false);
    this.clearFormError();
    this.setState({ addSelected: e });
  };

  onChangeDelete = (e) => {
    this.setTagInvalid(false);
    this.clearFormError();
    this.setState({ deleteSelected: e });
  };

  checkTag = (tag: string) => {
    //Check tag length
    if (tag.length > 32) {
      this.setFormError('Tag name exceeds 32 characters');
      this.setTagInvalid(true);
    }

    //Check for duplicate tags
    let match = this.state.currentTags.some((e) => {
      return e === tag;
    });
    if (match) {
      this.setFormError('Tag name already exists, try a different tag name');
      this.setTagInvalid(true);
    }
  };

  onAdditionalUserSearchChange = (searchValue: any) => {
    if (!searchValue) {
      this.setInvalid(false);

      return;
    }

    this.setInvalid(!isValid(searchValue));
  };

  onAdditionalUserChange = (selectedOptions: { label: string }[]) => {
    this.setSelectedOptions(selectedOptions);
    this.setInvalid(false);
  };

  //get username
  onCreateOption = (searchValue: any) => {
    if (!isValid(searchValue) || searchValue == this.state.username) {
      // Return false to explicitly reject the user's input.
      return false;
    }

    const newOption = {
      label: searchValue,
    };

    // Select the option.
    this.setSelectedOptions([...this.state.selectedOptions, newOption]);
  };

  getUser = async () => {
    const core = getCore();

    await core.http
      .get('/api/spitting_alpaca/getuser')
      .then((res: { time: string; username: string }) => {
        this.setState({ username: res.username });
      })
      .catch((err) => console.log('getusername failed:' + err));
  };

  onSwitchChange = (e: EuiSwitchEvent) => {
    this.setAppendOrDeleteSwitchOption(e.target.checked);
  };

  selectedOptionsToStrings = () => {
    let retval: string[] = [];

    this.state.selectedOptions.forEach((user) => {
      retval.push(user.label);
    });

    return retval;
  };

  //RENDER
  render() {
    //Initalize modals
    let modal;
    let submodal;

    //Create submodal (confirmation)
    if (this.state.createConfirm) {
      submodal = (
        <EuiConfirmModal
          title="Please Confirm Your Tag"
          onCancel={this.closeSubmodal}
          onConfirm={this.onCreateConfirm}
          cancelButtonText="I need to change it"
          confirmButtonText="Looks Good"
          defaultFocusedButton="confirm"
        >
          <dl className="eui-definitionListReverse">
            <dt>Tag Name:</dt>
            <dd>{this.state.createTagField}</dd>
            <dt>Details:</dt>
            <dd
              style={
                this.state.createDetailsField.length < 1 ? { color: 'gray' } : { color: 'white' }
              }
            >
              {this.state.createDetailsField.length < 1
                ? '(Field empty)'
                : this.state.createDetailsField}
            </dd>
            <dt>Users:</dt>
            <dd
              style={
                this.state.createDetailsField.length < 1 ? { color: 'gray' } : { color: 'white' }
              }
            >
              {this.state.selectedOptions.length < 1
                ? '(Field Empty)'
                : this.selectedOptionsToStrings().toString()}
            </dd>
          </dl>
          <p>Does your tag look correct?</p>
        </EuiConfirmModal>
      );
    }

    //Add submodal (confirmation)
    if (this.state.addConfirm) {
      submodal = (
        <EuiConfirmModal
          title="Please Confirm Your Tag Selection"
          onCancel={this.closeSubmodal}
          onConfirm={this.onAddConfirm}
          cancelButtonText="I need to change it"
          confirmButtonText="Looks Good"
          defaultFocusedButton="confirm"
        >
          <dl className="eui-definitionListReverse">
            <dt>Selected Tags:</dt>
            <dd>
              {this.state.addSelected.map((item) => (
                <li>{item.label}</li>
              ))}
            </dd>
          </dl>
          <p>Does your tag selection look correct?</p>
        </EuiConfirmModal>
      );
    }

    //Delete submodal (confirmation)
    if (this.state.deleteConfirm) {
      submodal = (
        <EuiConfirmModal
          title="Please Confirm Your Tag Selection"
          onCancel={this.closeSubmodal}
          onConfirm={this.onDeleteConfirm}
          cancelButtonText="I need to change it"
          confirmButtonText="Delete tag(s)"
          defaultFocusedButton="confirm"
          buttonColor="danger"
        >
          <dl className="eui-definitionListReverse">
            <dt>Selected Tags:</dt>
            <dd>
              {this.state.deleteSelected.map((item) => (
                <li>{item.label}</li>
              ))}
            </dd>
          </dl>
          <p>Does your tag selection look correct?</p>
        </EuiConfirmModal>
      );
    }

    switch (this.state.currentModal) {
      //Create modal
      case 'create':
        modal = (
          <EuiModal onClose={this.closeModal}>
            <EuiModalHeader>
              <EuiModalHeaderTitle>
                <h1>Create Tag</h1>
                <EuiSpacer size="s" />
                <EuiSwitch
                  label={
                    this.state.addOrCreateTagSwitchOption
                      ? 'Add Tag to Document'
                      : 'Create Tag Only'
                  }
                  checked={this.state.addOrCreateTagSwitchOption}
                  onChange={(e) => this.onSwitchChange(e)}
                />
              </EuiModalHeaderTitle>
            </EuiModalHeader>

            <EuiModalBody>
              <EuiText>
                <p>Tag name</p>
              </EuiText>
              <EuiFieldText
                placeholder="Tag name"
                isInvalid={this.state.tagInvalid}
                value={this.state.createTagField}
                onChange={(e) => this.onChangeCreateTagField(e)}
              />
              <EuiSpacer size="s" />
              <EuiText>
                <p>Details (optional)</p>
              </EuiText>
              <EuiTextArea
                placeholder="Tag details"
                value={this.state.createDetailsField}
                onChange={(e) => this.onChangeCreateDetailsField(e)}
              />
              <EuiText color="danger" hidden={this.state.hideFormError} size="s">
                <p>{this.state.formErrorMessage}</p>
              </EuiText>

              <EuiAccordion id={'EuiUserAccordion'} buttonContent={text}>
                <EuiComboBox
                  noSuggestions
                  placeholder="Enter username/s"
                  selectedOptions={this.state.selectedOptions}
                  onCreateOption={this.onCreateOption}
                  onChange={this.onAdditionalUserChange}
                  onSearchChange={this.onAdditionalUserSearchChange}
                  isInvalid={this.state.isInvalid}
                />
              </EuiAccordion>
            </EuiModalBody>

            <EuiModalFooter>
              <EuiButtonEmpty onClick={this.closeModal}>Close</EuiButtonEmpty>
              <EuiButton onClick={this.onCreateSubmit} fill>
                Submit
              </EuiButton>
            </EuiModalFooter>
            {submodal}
          </EuiModal>
        );
        break;

      //Existing modal
      case 'existing':
        modal = (
          <EuiModal onClose={this.closeModal}>
            <EuiModalHeader>
              <EuiModalHeaderTitle>Add Existing Tag</EuiModalHeaderTitle>
            </EuiModalHeader>

            <EuiModalBody>
              <EuiText>
                <p>Tags</p>
              </EuiText>
              <EuiComboBox
                placeholder="Click to select tags..."
                options={this.state.addOptions}
                selectedOptions={this.state.addSelected}
                onChange={this.onChangeAdd}
                isClearable={true}
              />
              <EuiText color="danger" hidden={this.state.hideFormError} size="s">
                <p>{this.state.formErrorMessage}</p>
              </EuiText>
            </EuiModalBody>
            <EuiSpacer size="l" />
            <EuiModalFooter>
              <EuiButtonEmpty onClick={this.closeModal}>Close</EuiButtonEmpty>
              <EuiButton onClick={this.onAddSubmit} fill>
                Submit
              </EuiButton>
            </EuiModalFooter>
            {submodal}
          </EuiModal>
        );
        break;

      //Delete modal
      case 'delete':
        modal = (
          <EuiModal onClose={this.closeModal}>
            <EuiModalHeader>
              <EuiModalHeaderTitle>Delete Tag</EuiModalHeaderTitle>
            </EuiModalHeader>

            <EuiModalBody>
              <EuiText>
                <p>Tags</p>
              </EuiText>
              <EuiComboBox
                placeholder="Click to select tags..."
                options={this.state.deleteOptions}
                selectedOptions={this.state.deleteSelected}
                onChange={this.onChangeDelete}
                isClearable={true}
              />
              <EuiText color="danger" hidden={this.state.hideFormError} size="s">
                <p>{this.state.formErrorMessage}</p>
              </EuiText>
            </EuiModalBody>
            <EuiSpacer size="l" />
            <EuiModalFooter>
              <EuiButtonEmpty onClick={this.closeModal}>Close</EuiButtonEmpty>
              <EuiButton onClick={this.onDeleteSubmit} fill>
                Submit
              </EuiButton>
            </EuiModalFooter>
            {submodal}
          </EuiModal>
        );
        break;
      case 'none':
        break;
      default:
        break;
    }
    var pageOfItems = this.state.tableRows;

    // console.log('Search length is: ' + this.state.searchValue.length);
    // console.log('Page length is: ' + pageOfItems.length);

    if (this.state.searchValue.length != 0) {
      pageOfItems = this.state.tableRows.filter((row) => this.filterRow(row));
    }

    var itemCount = pageOfItems.length;

    if (this.state.pageSize != 0) {
      pageOfItems = pageOfItems.slice(
        this.state.pageIndex * this.state.pageSize,
        this.state.pageIndex * this.state.pageSize + this.state.pageSize
      );
    }

    var pagination: Pagination = {
      pageIndex: this.state.pageIndex,
      pageSize: this.state.pageSize,
      totalItemCount: itemCount,
      pageSizeOptions: [10, 20, 50, 100],
    };

    return (
      <div className="eui-textBreakWord">
        <EuiSpacer size="l" />
        <EuiTitle>
          <h1>Data Tags</h1>
        </EuiTitle>
        <EuiHorizontalRule />
        <EuiFlexGroup gutterSize="l">
          <EuiFlexItem>
            <EuiCard
              icon={<EuiIcon size="xxl" type={'tag'} color="success" />}
              title={`Create`}
              description="Create a new data tag that can later be added to other documents"
              onClick={this.onCreateClick}
            />
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiCard
              icon={<EuiIcon size="xxl" type={'plus'} color="primary" />}
              title={`Add existing`}
              description="Add an existing data tag to this document"
              onClick={this.onExistingClick}
            />
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiCard
              icon={<EuiIcon size="xxl" type={'trash'} color="danger" />}
              title={`Delete`}
              description="Delete a data tag from this document"
              onClick={this.onDeleteClick}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size="xs" />

        <EuiFieldSearch
          value={this.state.searchValue}
          onChange={(e) => this.onSearchChange(e)}
          isClearable={true}
          fullWidth
          placeholder="Search..."
        />
        <EuiBasicTable
          className="eui-xScrollWithShadows"
          items={pageOfItems}
          loading={this.state.tableIsLoading}
          columns={this.state.tableColumns}
          tableLayout={'fixed'}
          pagination={pagination}
          sorting={this.state.sorting}
          onChange={this.onTableChange}
          rowHeader={'tag'}
          hasActions={true}
        />

        <EuiSpacer size="xxl" />

        {modal}
      </div>
    );
  }
}
