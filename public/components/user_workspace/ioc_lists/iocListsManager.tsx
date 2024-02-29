// import { getCore } from '../../../services';
// import React from 'react';
// import { Component, ReactNode } from 'react';
// import {
//   Direction,
//   EuiBasicTable,
//   EuiBasicTableColumn,
//   EuiButton,
//   EuiButtonEmpty,
//   EuiFieldText,
//   EuiForm,
//   EuiFormRow,
//   EuiModal,
//   EuiModalBody,
//   EuiModalFooter,
//   EuiModalHeader,
//   EuiModalHeaderTitle,
//   EuiPageContent,
//   EuiPage,
//   EuiPageBody,
//   EuiPageSideBar,
//   EuiSwitch,
//   EuiTableFieldDataColumnType,
//   EuiText,
//   Pagination,
//   EuiSideNav,
//   EuiSideNavItemType,
//   EuiButtonIcon,
//   EuiPopover,
//   EuiContextMenuItem,
//   EuiContextMenuPanel,
//   EuiFlexGroup,
// } from '@elastic/eui';
// import { AnalystTag } from 'plugins/spitting_alpaca/common/types';
// import ReactDOM from 'react-dom';
// import { SortDirection } from 'src/plugins/data/public';
// import { flattenObject } from '../../analyst_notes/helpers';

// interface ILMProps {}

// interface ILMState {
//   tableRows: any[];
//   responseData: any[];
//   tableColumns: any[];
//   pageIndex: number;
//   pageSize: number;
//   sortField: any;
//   sortDirection: Direction;
//   tableIsLoading: boolean;
//   actions: any[];
//   sorting: any;
//   sideNavItems: EuiSideNavItemType<any>[];
//   selectedNav: any;
//   pageContent: any;
//   fields: any[];
//   fieldData: any[];
//   iocData: any[];
//   isPopoverOpen: boolean;
// }

// export class IOCListsManager extends Component<ILMProps, ILMState> {
//   constructor(props: ILMProps) {
//     super(props);
//     this.state = {
//       tableRows: [],
//       responseData: [],
//       tableColumns: [],
//       pageIndex: 0,
//       pageSize: 10,
//       sortField: undefined,
//       sortDirection: 'asc',
//       tableIsLoading: true,
//       actions: this.createActions(),
//       sorting: this.createSorting(),
//       sideNavItems: [],
//       selectedNav: undefined,
//       pageContent: undefined,
//       fields: [],
//       fieldData: [],
//       iocData: [],
//       isPopoverOpen: false,
//     };
//     this.getIOCLists();
//   }

//   setPageIndex = (pageIndex: number) => {
//     this.setState({ pageIndex: pageIndex });
//   };
//   setPageSize = (pageSize: number) => {
//     this.setState({ pageSize: pageSize });
//   };
//   setSortField = (sortField: any) => {
//     this.setState({ sortField: sortField });
//   };
//   setSortDirection = (sortDirection: Direction) => {
//     this.setState({ sortDirection: sortDirection });
//   };

//   componentDidUpdate(prevProps, prevState) {
//     if (prevState.selectedNav !== this.state.selectedNav) {
//       console.log('Updating display to: ' + this.state.selectedNav);
//       this.updateDisplay(this.state.selectedNav);
//     }
//   }

//   createSorting() {
//     return {
//       sort: {
//         field: undefined,
//         direction: 'asc',
//       },
//     };
//   }

//   async getIOCLists() {
//     this.setState({ tableIsLoading: true });
//     await this.delay(1000);
//     const core = getCore();
//     let count = 0;

//     var temp = await core.http
//       .post('/api/spitting_alpaca/getioclists')
//       .then(async (res: any) => {
//         console.log('Response is: ');
//         console.log(res);

//         let list;
//         let tempDisplayList: {
//           listName: string;
//           id: number;
//           list: any;
//           creationDate: string;
//           username: string;
//         }[] = [];
//         try {
//           list = res.response.body.hits.hits;
//           list.forEach((row: any) => {
//             tempDisplayList.push({
//               listName: row._source.listName,
//               id: count,
//               list: this.parseList(JSON.parse(row._source.IOCList)),
//               creationDate: row._source.creationDate,
//               username: row._source.username,
//             });
//             count++;
//           });

//           console.log('The lists');
//           console.log(tempDisplayList);
//         } catch (err) {
//           console.log(err);
//         }

//         this.setState({ iocData: tempDisplayList });
//         this.setState({ responseData: res.response });
//         //this.createColumns();
//         //this.createRows();
//         this.createNavItems();
//         console.log('Rows are:');
//         console.log(this.state.responseData);
//         //console.log('Columns are:');
//         //console.log(this.state.tableColumns);
//         this.setState({ tableIsLoading: false });
//       })
//       .catch((err) => console.log(err));

//     return;
//   }

//   async deleteTag(tag: AnalystTag) {
//     const core = getCore();
//     const options = {
//       body: JSON.stringify({
//         rawtime: tag.rawtime,
//         username: tag.username,
//         timestamp: tag.timestamp,
//         originalId: tag.originalId,
//         originalIndex: tag.originalIndex,
//         fieldname: tag.fieldname,
//         fieldval: tag.fieldval,
//         tag: tag.tag,
//         applytoall: tag.applytoall,
//       }),
//     };

//     var temp = await core.http
//       .post('/api/spitting_alpaca/deletedatatag', options)
//       .then(async (res: any) => {
//         core.notifications.toasts.addSuccess(
//           {
//             title: (e) => {
//               ReactDOM.render(<EuiText>{res.ret}</EuiText>, e);
//               return () => ReactDOM.unmountComponentAtNode(e);
//             },
//           },
//           { toastLifeTimeMs: 3000 }
//         );
//       });
//     this.getIOCLists();
//   }

//   delay(time: number) {
//     return new Promise((resolve) => setTimeout(resolve, time));
//   }

//   parseList = (list) => {
//     var fields: any[] = [];
//     var tempItems: any = [];

//     list.forEach((row: any) => {
//       if (fields.includes(row.fieldName)) {
//         let tempArr: any = [];

//         //tempArr.push(tempItems[row.fieldName]);
//         //tempArr.push(row.fieldValue);
//         //tempItems[row.fieldName] = tempArr;
//         //tempItems[row.fieldName] = tempItems[row.fieldName].push(row.fieldValue);
//         //tempItems[row.fieldName].push(row.fieldValue);
//         tempItems[row.fieldName] = tempItems[row.fieldName] + ', ' + row.fieldValue;
//       } else {
//         fields.push(row.fieldName);
//         //tempItems[row.fieldName] = [];
//         //tempItems[row.fieldName].push(row.fieldValue);
//         tempItems[row.fieldName] = row.fieldValue;
//       }
//     });

//     return tempItems;
//   };

//   createNavItems = () => {
//     let tempItems: EuiSideNavItemType<any>[] = [];

//     for (let i = 0; i < this.state.iocData.length; i++) {
//       console.log('Row iteration: ' + i);
//       let row = this.state.iocData[i];

//       tempItems.push({
//         name: row.listName,
//         id: row.listName,

//         onClick: (e) => {
//           console.log(typeof e.currentTarget.textContent);
//           console.log('You clicked: ' + e.currentTarget.textContent);
//           this.setState({ selectedNav: e.currentTarget.textContent });
//         },
//       });
//     }

//     tempItems.sort((a, b) => {
//       let la = a.id?.toLocaleLowerCase(),
//         lb = b.id?.toLocaleLowerCase();
//       if (la === undefined || lb === undefined) {
//         return 0;
//       } else {
//         if (la < lb) {
//           return -1;
//         }
//         if (la > lb) {
//           return 1;
//         }
//       }
//       return 0;
//     });

//     console.log('Side nav items are: ');
//     console.log(tempItems);
//     this.setState({ sideNavItems: tempItems });
//   };

//   updateDisplay = (selectedNavItem) => {
//     console.log('Clicked side nav item ' + selectedNavItem);
//     let pageContent = [];
//     let row = flattenObject(
//       this.state.iocData[this.state.iocData.findIndex((e) => e.listName === selectedNavItem)]
//     );
//     console.log('Selected row is: ');
//     console.log(row);

//     for (var prop in row) {
//       console.log(prop);
//       pageContent.push(
//         <EuiFormRow label={prop.replace('list.', '')}>
//           <EuiText>{row[prop]}</EuiText>
//         </EuiFormRow>
//       );
//     }

//     console.log(pageContent);
//     //this.getFields(row);
//     this.setState({ pageContent: pageContent });
//   };

//   getFields = (data: { [x: string]: any; }) => {
//     let tempFields = [];

//     for (var prop in data) {
//       if (prop.includes('IOCList.')) {
//         data[prop.replace('IOCList.', '')] = data[prop];
//         tempFields.push(prop.replace('IOCList.', ''));
//         delete data[prop];
//       } else {
//         delete data[prop];
//       }
//     }

//     this.setState({ fields: tempFields });
//     this.setState({ fieldData: data });

//     console.log('Fields are: ');
//     console.log(tempFields);
//     console.log('Field data is: ');
//     console.log(data);
//   };

//   createActions = () => {
//     return [
//       <EuiContextMenuItem key="copy" icon="copy" onClick={this.closePopover}>
//         Copy
//       </EuiContextMenuItem>,
//       <EuiContextMenuItem key="edit" icon="pencil" onClick={this.closePopover}>
//         Edit
//       </EuiContextMenuItem>,
//       <EuiContextMenuItem color="danger" key="delete" icon="trash" onClick={this.closePopover}>
//         Delete
//       </EuiContextMenuItem>,
//     ];
//   };

//   getColumnIndex = (columns: EuiTableFieldDataColumnType<any>[], name: string) => {
//     for (let i = 0; i < columns.length; i++) {
//       if (columns[i].name == name) {
//         console.log('Match found for ' + columns[i].name + ' returning ' + i);
//         return i as number;
//       }
//     }
//     return -1;
//   };

//   createColumns = () => {
//     let tempColumns: EuiTableFieldDataColumnType<any>[] = [];
//     let withActions: any[] = [];
//     for (let i = 0; i < this.state.responseData.length; i++) {
//       for (let x = 0; x < this.state.responseData[i].length; x++) {
//         let keys = Object.keys(this.state.responseData[i][x]);

//         console.log('Keys are: ');
//         console.log(keys);

//         keys.forEach((key) => {
//           if (tempColumns.findIndex((element) => element.name === key) === -1) {
//             tempColumns.push({
//               field: key as string,
//               name: key,
//               //sortable: (item) => this.columnSort(item),
//               truncateText: true,
//               //footer: <span>{key}</span>,
//             });
//           }
//         });
//         console.log('Keys in return data');
//         console.log(keys);
//       }
//     }
//     console.log('Temp columns are: ');
//     console.log(tempColumns);
//     console.log('my index is ' + this.getColumnIndex(tempColumns, '_index'));
//     console.log('index Index: ' + tempColumns.findIndex((e) => e.name === '_index'));

//     tempColumns.splice(this.getColumnIndex(tempColumns, '_index'), 1);
//     tempColumns.splice(this.getColumnIndex(tempColumns, 'username'), 1);
//     tempColumns.splice(
//       0,
//       0,
//       tempColumns.splice(this.getColumnIndex(tempColumns, 'fieldval'), 1)[0]
//     );
//     tempColumns.splice(
//       0,
//       0,
//       tempColumns.splice(this.getColumnIndex(tempColumns, 'fieldname'), 1)[0]
//     );
//     tempColumns.splice(0, 0, tempColumns.splice(this.getColumnIndex(tempColumns, 'tag'), 1)[0]);

//     withActions = tempColumns;

//     withActions.push({
//       name: 'Actions',
//       actions: this.state.actions,
//     });

//     this.setState({ tableColumns: withActions });
//   };

//   columnSort = (item: any) => {
//     item.sort((a, b) => {
//       let la = a?.toLocaleLowerCase(),
//         lb = b?.toLocaleLowerCase();
//       if (la === undefined || lb === undefined) {
//         return 0;
//       } else {
//         if (la < lb) {
//           return -1;
//         }
//         if (la > lb) {
//           return 1;
//         }
//       }
//       return 0;
//     });
//     return item;
//   };

//   createRows = () => {
//     let tempRows: any = [];

//     for (let i = 0; i < this.state.responseData.length; i++) {
//       console.log('Row iteration: ' + i);
//       let tempObj: any = [];
//       for (let x = 0; x < this.state.responseData[i].length; x++) {
//         let keys = Object.keys(this.state.responseData[i][x]);
//         keys.forEach((key) => {
//           tempObj[key] = this.state.responseData[i][x][key];
//           console.log('Data is: ' + this.state.responseData[i][x][key]);
//         });
//       }
//       tempRows.push(Object.assign({}, tempObj));
//     }

//     tempRows.sort((a, b) => {
//       let la = a.tag?.toLocaleLowerCase(),
//         lb = b.tag?.toLocaleLowerCase();
//       if (la === undefined || lb === undefined) {
//         return 0;
//       } else {
//         if (la < lb) {
//           return -1;
//         }
//         if (la > lb) {
//           return 1;
//         }
//       }
//       return 0;
//     });

//     console.log('Create new rows are: ');
//     console.log(tempRows);
//     this.setState({ tableRows: tempRows });
//   };

//   onTableChange = ({ page = {}, sort = {} }) => {
//     const { index: pageIndex, size: pageSize } = page;
//     const { field: sortField, direction: sortDirection } = sort;

//     this.setPageIndex(pageIndex);
//     this.setPageSize(pageSize);
//     this.setSortField(sortField);
//     this.setSortDirection(sortDirection);
//     this.setState({ sorting: { sort: { field: sortField, direction: sortDirection } } });
//   };

//   onButtonClick = () => {
//     this.setState({ isPopoverOpen: !this.state.isPopoverOpen });
//   };

//   closePopover = () => {
//     this.setState({ isPopoverOpen: false });
//   };

//   render(): ReactNode {
//     var pageOfItems = this.state.tableRows;
//     if (this.state.pageSize != 0) {
//       pageOfItems = this.state.tableRows.slice(
//         this.state.pageIndex * this.state.pageSize,
//         this.state.pageIndex * this.state.pageSize + this.state.pageSize
//       );
//     }

//     var pagination: Pagination = {
//       pageIndex: this.state.pageIndex,
//       pageSize: this.state.pageSize,
//       totalItemCount: this.state.tableRows.length,
//       pageSizeOptions: [10, 20, 50, 100],
//     };

//     var sorting = {
//       sort: {
//         field: this.state.sortField,
//         direction: this.state.sortDirection,
//       },
//     };

//     return (
//       <div>
//         <EuiPage paddingSize="none">
//           <EuiPageSideBar paddingSize="l">
//             <EuiSideNav
//               isLoading={this.state.tableIsLoading}
//               className="eui-yScrollWithShadows"
//               heading="IOC Lists"
//               items={this.state.sideNavItems}
//             />
//           </EuiPageSideBar>
//           <EuiPageBody paddingSize="none" panelled={true}>
//             <EuiPageContent>
//               <EuiFlexGroup>
//                 <EuiPopover
//                   button={
//                     <EuiButtonIcon
//                       display="empty"
//                       size="s"
//                       iconType="boxesVertical"
//                       aria-label="More"
//                       onClick={this.onButtonClick}
//                       color="text"
//                     />
//                   }
//                   isOpen={this.state.isPopoverOpen}
//                   closePopover={this.closePopover}
//                   panelPaddingSize="none"
//                   anchorPosition="downCenter"
//                 >
//                   <EuiContextMenuPanel size="s" items={this.state.actions} />
//                 </EuiPopover>
//               </EuiFlexGroup>
//               {this.state.pageContent}
//             </EuiPageContent>
//           </EuiPageBody>
//         </EuiPage>
//       </div>
//     );
//   }
// }

// /*

// <EuiBasicTable
//           className="eui-xScrollWithShadows"
//           items={pageOfItems}
//           loading={this.state.tableIsLoading}
//           columns={this.state.tableColumns}
//           tableLayout={'fixed'}
//           pagination={pagination}
//           sorting={this.state.sorting}
//           onChange={this.onTableChange}
//           rowHeader={'tag'}
//           hasActions={true}
//         />

// {
//         name: 'Edit',
//         isPrimary: true,

//         description: 'Edit this tag',
//         icon: 'pencil',
//         type: 'icon',
//         onClick: () => {},
//         'data-test-subj': 'action-edit',
//       },

// isModalVisible:boolean;

// isModalVisible:false,

// setIsModalVisible = (isModalVisible:boolean)=>{
//     this.setState({ isModalVisible : isModalVisible });
//   }

//   closeModal = () => this.setIsModalVisible(false);

//   showModal = () => this.setIsModalVisible(true);

//   if (this.state.isModalVisible) {
//       var form =
//         <EuiForm component="form">

//           <EuiFormRow label="Tag">
//             <EuiFieldText name="tag" />
//           </EuiFormRow>

//         </EuiForm>
//       ;

//       var modal =
//         <EuiModal onClose={this.closeModal} >
//           <EuiModalHeader>
//             <EuiModalHeaderTitle>
//               <h1>Edit Data Tag</h1>
//             </EuiModalHeaderTitle>
//           </EuiModalHeader>

//           <EuiModalBody>{form}</EuiModalBody>

//           <EuiModalFooter>
//             <EuiButtonEmpty onClick={this.closeModal}>Cancel</EuiButtonEmpty>

//             <EuiButton type="submit" onClick={this.closeModal} fill>
//               Save
//             </EuiButton>
//           </EuiModalFooter>
//         </EuiModal>
//       ;
//     }

// */
