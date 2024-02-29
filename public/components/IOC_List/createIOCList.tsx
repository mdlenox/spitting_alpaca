import {
  Criteria,
  EuiBasicTable,
  EuiButton,
  EuiButtonEmpty,
  EuiCopy,
  EuiFieldText,
  EuiFilePicker,
  EuiFlexGroup,
  EuiFlexItem,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiSpacer,
  EuiText,
  EuiTextColor,
  useGeneratedHtmlId,
  EuiAccordion,
  EuiIconTip,
  EuiComboBox,
  EuiTextArea,
} from '@elastic/eui';
import { isValid } from '../../../common/helpers';

import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { getCore } from '../../services';

interface createIOCListProps {
  updateIOCList: (listItem: {
    listName: string;
    list: string;
    creationDate: string;
    username: string;
    updateDate: string;
    hasUpdated: boolean;
    elasticID: string;
    additionalUsers: string[];
    description: string;
    listSource: string;
  }) => void;
}

const CreateIOCList = (Props: createIOCListProps) => {
  const core = getCore();
  const [files, setFiles] = useState<FileList | undefined | null>(undefined);
  const [IOCList, setIOCList] = useState<
    { rowCount: number; fieldName: string; fieldValue: string; note: string; flag: string }[]
  >([]);
  const [fileIsInvalid, setFileIsInvalid] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [fileErrorCount, setFileErrorCount] = useState<number[]>([]);
  const [showGeneratedList, setShowGeneratedList] = useState(false);
  const [IOCListTitle, setIOCListTitle] = useState('');
  const [isIOCListNameInvalid, setIsIOCListNameInvalid] = useState(false);
  const [generateListIsLoading, setGenerateListIsLoading] = useState(false);
  const [IOCDSLFilter, setIOCDSLFilter] = useState('');
  const [pageSize, setPageSize] = useState(100);
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedOptions, setSelected] = useState<{ label: string }[]>([]);
  const [isInvalid, setInvalid] = useState(false);
  const [username, setUsername] = useState<string>();
  const [IOCListDescription, setIOCListDescription] = useState<string>('');

  const simpleAccordionId = useGeneratedHtmlId({ prefix: 'simpleAccordion' });

  useEffect(() => {
    // console.log('starting generator');
    const populateUsername = async () => {
      try {
        setUsername(await getUser());

        await getConnectors();
      } catch (err) {
        console.log(err);
      }
    };

    populateUsername();
  }, []);

  const getConnectors = async () => {
    // console.log('Getting Connectors');
    const res = await core.http.get('/api/actions/connectors');
    // console.log(res);
  };

  const onCreateIOCList = () => {
    // console.log('on submit');
    showModal();
  };

  useEffect(() => {
    // console.log('trying 0async');
    if (generateListIsLoading) {
      // console.log('3');
      createFilter();
      setFileIsInvalid(false);
      setIsIOCListNameInvalid(false);
      setShowGeneratedList(true);
    }
  }, [generateListIsLoading]);

  const onGenerateList = async () => {
    //checking to see if the filename alreay exists
    if (await listNameDuplicateChecker()) {
      setIsIOCListNameInvalid(true);
      toastMessageWarning('List Not Saved: List name already exists, try another name', 4000);
      return;
    }

    //checking to see if the file is null and if so set it to isinvalid true
    if (IOCListTitle.length == 0) {
      //there is no title,
      setIsIOCListNameInvalid(true);
      return;
    } else if (files == undefined || files.length == 0) {
      //there is no file selected or a file with of the wrong type was selected and it didnt load the file in since it was the wrong type in filechanger
      setFileIsInvalid(true);
      setIsIOCListNameInvalid(false);
      return;
    } else if (IOCListDescription.length > 500) {
      return;
    } else {
      // console.log('Processing File:' + files[0].name);
      setGenerateListIsLoading(true); //set the loading button
    }
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setIOCList([]);
    setFiles(undefined);
    setFileErrorCount([]);
    setFileIsInvalid(false);
    setShowGeneratedList(false);
    setIsIOCListNameInvalid(false);
    setIOCListTitle('');
    setGenerateListIsLoading(false);
    setSelected([]);
    setIOCListDescription('');
  };

  const showModal = () => {
    setIsModalVisible(true);
  };

  const toastMessageSuccess = (message: string) => {
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

  //Clear all data related to removed file
  const clearFileData = () => {
    setFiles(undefined);
    setIOCList([]);
    setFileErrorCount([]);
    setShowGeneratedList(false);
    setGenerateListIsLoading(false);
  };

  const onFilePickerChange = (files: FileList | undefined | null) => {
    let fieldsHeader: string[] = ['fields', 'indicator_type'];
    let selectorsHeader: string[] = ['selectors', 'indicator'];
    let notesHeader: string[] = ['notes', 'comment'];

    //Check for nonexistent or removed file
    if (files == null || files == undefined || files.length == 0) {
      clearFileData();
      return;
    }
    //Check for valid file extension
    var ext = files[0].name.split('.').pop();
    if (ext != 'csv') {
      toastMessageWarning('Invalid file extension, .csv required', 3000);
      clearFileData();
      setFileIsInvalid(true);
      return;
    }
    setFiles(files);
    var reader = new FileReader();
    //File reader onload method when read is called
    reader.onload = (e) => {
      //Check for null file data
      if (e.target == null || e.target.result == null) {
        clearFileData();
        setFileIsInvalid(true);
        return;
      }
      var fileData = e.target.result as string;
      //Check for empty file contents
      if (fileData.trim().length == 0) {
        toastMessageWarning('No file contents, upload a .csv', 3000);
        clearFileData();
        setFileIsInvalid(true);
        return;
      }

      //Parse file data

      let IOCList: {
        rowCount: number;
        fieldName: string;
        fieldValue: string;
        note: string;
        flag: string;
      }[] = [];
      var values = fileData.split(/\n/).filter(Boolean);
      let count = 0;
      let errors: number[] = [];

      values.forEach((element: string) => {
        count++; //count for what row it is iterating on
        let tempElement: {
          rowCount: number;
          fieldName: string;
          fieldValue: string;
          note: string;
          flag: string;
        } = {
          rowCount: 0,
          fieldName: '',
          fieldValue: '',
          flag: '',
          note: '',
        };
        let headers = element.split(',');

        // console.log(headers);

        //checking to see if the fieldname or fieldvalue is null, if so add the row number to an array
        if (headers[0].length == 0 || headers[1].length == 0) {
          // console.log(count);
          errors.push(count);
        } else if (count == 1) {
          try {
            if (
              !fieldsHeader.includes(headers[0].toLowerCase()) ||
              !selectorsHeader.includes(headers[1].toLowerCase()) ||
              headers[2].toLowerCase() != 'flag' ||
              !notesHeader.includes(headers[3].toLowerCase().trim())
            ) {
              //if the hearders are not exactly what we are looking for then we throw a negative one error
              if (headers[0].toLowerCase() == 'indicator_type') {
                errors.push(-2);
              } else {
                errors.push(-1);
              }
            }
          } catch (err) {
            console.log(err);
          }
        }
        tempElement.rowCount = count;
        tempElement.fieldName = headers[0];
        tempElement.fieldValue = headers[1];
        tempElement.flag = headers[2];
        tempElement.note = headers[3];

        if (count == 1) {
          //dont allow the headers to be added to the list
        } else {
          IOCList.push(tempElement);
        }
      });

      setFileErrorCount(errors);

      setIOCList(removeDuplicates(IOCList));
    };
    //Read file if not null
    if (files[0] != null) {
      reader.readAsText(files[0]);
      setFileIsInvalid(false);
    }
  };

  const removeDuplicates = (
    list: {
      rowCount: number;
      fieldName: string;
      fieldValue: string;
      flag: string;
      note: string;
    }[]
  ) => {
    let updatedList: {
      rowCount: number;
      fieldName: string;
      fieldValue: string;
      flag: string;
      note: string;
    }[] = [];

    list.forEach((row) => {
      let duplicateFlag: boolean = false;

      //iterate through the list and check for duplicates
      if (updatedList.length == 0) {
        updatedList.push({
          rowCount: 1,
          fieldName: row.fieldName,
          fieldValue: row.fieldValue,
          flag: row.flag,
          note: row.note,
        });
      } else {
        for (let i = 0; i <= updatedList.length - 1; i++) {
          if (
            updatedList[i].fieldName == row.fieldName &&
            updatedList[i].fieldValue == row.fieldValue
          ) {
            duplicateFlag = true;
          }
        }
        if (duplicateFlag != true) {
          //if the duplicate flag is not set to true a duplicate is not found
          updatedList.push({
            rowCount: updatedList.length + 1,
            fieldName: row.fieldName,
            fieldValue: row.fieldValue,
            flag: row.flag,
            note: row.note,
          });
        }
      }
    });

    return updatedList;
  };

  const generateErrorList = () => {
    let errorMessage: any = [];

    fileErrorCount.forEach((error) => {
      // console.log(error);

      if (error == -1) {
        errorMessage.push(
          'Headers "Fields, Selectors, Flag, Notes" not poperly set up or extra colmuns present'
        );
      } else if (error == -2) {
        errorMessage.push(
          'Headers "Indicator_type, Indicator, Flag, Comment" not poperly set up or extra colmuns present'
        );
      } else {
        errorMessage.push(
          'Error in file on row:#' + error + ',' + JSON.stringify(IOCList[error - 2])
        );
      }
    });

    if (errorMessage.length > 0) {
      return (
        <EuiTextColor color="danger">
          File Errors: <br />
          {errorMessage.map((error: any) => (
            <li>{error}</li>
          ))}
        </EuiTextColor>
      );
    }
    // console.log('error list in function' + errorMessage);

    return '';
  };

  const getUser = async () => {
    let user = '';

    await core.http
      .get('/api/spitting_alpaca/getuser')
      .then((res: { time: string; username: string }) => {
        user = res.username;
      })
      .catch((err) => console.log('getusername failed:' + err));
    return user;
  };

  const listNameDuplicateChecker = async () => {
    var options = {
      body: JSON.stringify({
        listName: IOCListTitle.trim(),
      }),
    };

    var checkerStatus;

    await core.http.post('/api/spitting_alpaca/checkioclistname', options).then((res: any) => {
      //true, the list name already exist
      //false the list name doesnt exist
      checkerStatus = res.status;
    });
    // console.log(checkerStatus);
    return checkerStatus;
  };

  const getAdditionalUsers = () => {
    let retVal: string[] = [];

    selectedOptions.forEach((item) => {
      retVal.push(item.label);
    });

    return retVal;
  };

  const onSaveIOCList = async () => {
    //check to see if the list name exists and if there are errors
    //if there are any errors the file will not be saved

    if (await listNameDuplicateChecker()) {
      toastMessageWarning('List Not Saved: List name already exists, try another name', 4000);
      return;
    } else if (IOCListTitle.length > 40) {
      toastMessageWarning('List Not Saved: List name to longer must be under 40 characters', 4000);
      return;
    } else if (fileErrorCount.length > 0) {
      toastMessageWarning('List Not Saved: due to file errors', 4000);
      return;
    }

    let user = await getUser();
    let date = await new Date().toISOString();
    var options = {
      body: JSON.stringify({
        username: user,
        IOCList: JSON.stringify(IOCList),
        listName: IOCListTitle.trim(),
        creationDate: date,
        updateDate: date,
        hasUpdated: false,
        additionalUsers: getAdditionalUsers(),
        description: IOCListDescription,
        listSource: 'User',
      }),
    };
    // console.log(JSON.stringify(options));

    let stringSize = new Blob([options.body]).size;

    let IOCListArray: (string | number)[][] = [];

    IOCList.forEach((e) => {
      let tempArray = [];
      tempArray.push(e.fieldName);
      tempArray.push(e.fieldValue);
      tempArray.push(e.flag);
      tempArray.push(e.note);
      tempArray.push(e.rowCount);

      IOCListArray.push(tempArray);
    });

    let IOCListOriginalSize = new Blob([options.body]).size;

    var options2 = {
      body: JSON.stringify({
        username: user,
        IOCList: JSON.stringify(IOCListArray),
        listName: IOCListTitle.trim(),
        creationDate: date,
        updateDate: date,
        hasUpdated: false,
        additionalUsers: getAdditionalUsers(),
        description: IOCListDescription,
        listSource: 'User',
      }),
    };

    let IOCListNewSize = new Blob([options2.body]).size;

    let newArray: {
      fieldName: string | number;
      fieldValue: string | number;
      flag: string | number;
      note: string | number;
      rowCount: string | number;
    }[] = [];
    IOCListArray.forEach((e) => {
      newArray.push({ fieldName: e[0], fieldValue: e[1], flag: e[2], note: e[3], rowCount: e[4] });
    });

    core.http

      .put('/api/spitting_alpaca/addioclist', options2)
      .then((res: any) => {
        console.log(res);

        if (res.status == 200) {
          //no error
          toastMessageSuccess('IOC List Created Successfully');
          let item = {
            listName: IOCListTitle,
            list: JSON.stringify(IOCList),
            creationDate: date,
            username: user,
            updateDate: date,
            hasUpdated: false,
            elasticID: '0',
            additionalUsers: getAdditionalUsers(),
            description: IOCListDescription,
            listSource: 'User',
          };
          Props.updateIOCList(item);
          closeModal();
          // console.log('saved new list');
        } else if (res.status == 401) {
          toastMessageWarning('List Not Saved: List name already exists, try another name', 4000);
        } else {
          try {
            if (res.error.meta.body.error.hasOwnProperty('caused_by')) {
              toastMessageWarning(
                'IOC List not created: ' +
                  res.error.meta.body.error.caused_by.type +
                  ' : ' +
                  res.error.meta.body.error.caused_by.reason,
                4000
              );
            } else if (res.error.meta.body.error.hasOwnProperty('reason')) {
              toastMessageWarning(
                'IOC List not created: ' + res.error.meta.body.error.reason,
                4000
              );
            }
          } catch (err) {
            //toast generic message
            toastMessageWarning('Unable to create IOC List', 4000);
          }
        }
      })
      .catch((err) => {
        let message = 'Uknown Error';

        if (err instanceof Error) {
          message = err.message;
        }
        toastMessageWarning(message, 4000);
        console.log(err);
      });
  };

  const onBack = () => {
    setShowGeneratedList(false);
    setFiles(undefined);
    setGenerateListIsLoading(false);
  };

  const createFilter = async () => {
    var tempFilterString: string = '{ "query": { "bool": { "should": [';
    IOCList.forEach((row) => {
      // console.log(row);
      tempFilterString = tempFilterString.concat(
        '{ "match_phrase": { "' + row.fieldName + '":"' + row.fieldValue + '" } },'
      );
    });
    tempFilterString = tempFilterString.slice(0, tempFilterString.length - 1);
    tempFilterString = tempFilterString.concat('], "minimum_should_match": 1 } }}');
    // console.log(tempFilterString);
    setIOCDSLFilter(tempFilterString);
  };

  const getRowProps = (item: { id: any }) => {
    const { id } = item;
    return {
      'data-test-subj': `row-${id}`,
      className: 'customRowClass',
      onClick: () => {},
    };
  };

  const addStringWraping = (s: string) => {
    var stringBuilder = '';

    for (let i = 0; i < s.length; i++) {
      stringBuilder = stringBuilder + s[i] + '\u200B';
    }

    return stringBuilder;
  };

  const getCellProps = (item: { id: any }, column: { field: any }) => {
    const { id } = item;
    const { field } = column;
    return {
      className: 'customCellClass',
      'data-test-subj': `cell-${id}-${field}`,
      textOnly: true,
    };
  };

  const columns = [
    {
      field: 'rowCount',
      name: 'Row',
      truncateText: true,
      'data-test-subj': 'fieldNameCell',
    },
    {
      field: 'fieldName',
      name: 'Field Name',
      sortable: true,
      'data-test-subj': 'fieldNameCell',
      width: 200,
    },
    {
      field: 'fieldValue',
      name: 'Selector',
    },
    {
      field: 'flag',
      name: 'Flag',
    },
    {
      field: 'note',
      name: 'Notes',
    },
  ];

  const download = function (data: BlobPart) {
    // Creating a Blob for having a csv file format
    // and passing the data with type
    const blob = new Blob([data], { type: 'text/csv' });

    // Creating an object for downloading url
    const url = window.URL.createObjectURL(blob);

    // Creating an anchor(a) tag of HTML
    const a = document.createElement('a');

    // Passing the blob downloading url
    a.setAttribute('href', url);

    // Setting the anchor tag attribute for downloading
    // and passing the download file name
    a.setAttribute('download', 'IOCListFormat.csv');

    // Performing a download with click
    a.click();
  };

  const csvmaker = function (data: { [s: string]: unknown } | ArrayLike<unknown>) {
    // Empty array for storing the values
    let csvRows = [];

    // Headers is basically a keys of an
    // object which is id, name, and
    // profession
    const headers = Object.keys(data);

    // As for making csv format, headers
    // must be separated by comma and
    // pushing it into array
    csvRows.push(headers.join(','));

    // Pushing Object values into array
    // with comma separation
    const values = Object.values(data).join(',');
    csvRows.push(values);

    // Returning the array joining with new line
    return csvRows.join('\n');
  };

  const get = async function () {
    // JavaScript object
    const data = {
      Fields: '',
      Selectors: '',
      flag: '',
      Notes: '',
    };

    const csvdata = csvmaker(data);
    download(csvdata);
  };

  let errors = generateErrorList();

  const onTableChange = ({
    page,
    sort,
  }: Criteria<
    {
      rowCount: number;
      fieldName: string;
      fieldValue: string;
    }[]
  >) => {
    if (page) {
      const { index: pageIndex, size: pageSize } = page;
      setPageIndex(pageIndex);
      setPageSize(pageSize);
    }
  };

  const findUsers = (
    users: {
      rowCount: number;
      fieldName: string;
      fieldValue: string;
      flag: string;
      note: string;
    }[],
    pageIndex: number,
    pageSize: number
  ) => {
    let items = IOCList;

    let pageOfItems;

    if (!pageIndex && !pageSize) {
      pageOfItems = items;
    } else {
      const startIndex = pageIndex * pageSize;
      pageOfItems = items.slice(startIndex, Math.min(startIndex + pageSize, IOCList.length));
    }

    return {
      pageOfItems,
      totalItemCount: IOCList.length,
    };
  };

  const { pageOfItems, totalItemCount } = findUsers(IOCList, pageIndex, pageSize);

  const pagination = {
    pageIndex: pageIndex,
    pageSize: pageSize,
    totalItemCount: totalItemCount,
    pageSizeOptions: [15, 25, 50, 100],
  };

  const text = (
    <EuiText>
      <p>
        Add Additional Users
        <EuiIconTip
          type="iInCircle"
          color="subdued"
          content={
            <span>Users added will be able to edit/delete the IOC List after creation.</span>
          }
          iconProps={{
            className: 'eui-alignTop',
          }}
        />
      </p>
    </EuiText>
  );

  const onCreateOption = (searchValue: any) => {
    if (!isValid(searchValue) || searchValue == username) {
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
    let retValue: string = '';

    selectedOptions.forEach((item) => {
      retValue += item.label + ',';
    });

    retValue = retValue.substring(0, retValue.length - 1);

    return retValue;
  };

  let descriptionCount =
    IOCListDescription.length < 501 ? (
      <p>{IOCListDescription.length} / 500</p>
    ) : (
      <p style={{ color: 'red' }}>{IOCListDescription.length} / 500</p>
    );

  return (
    <div>
      <EuiFlexGroup gutterSize="s" alignItems="flexEnd" responsive={false} wrap>
        <EuiFlexItem grow={true}>
          <EuiSpacer size="s" />
          <EuiButton
            fullWidth
            size="s"
            onClick={onCreateIOCList}
            className="CreateIOCListButton"
            data-test-subj="createIOCListButton"
          >
            Create IOC List
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size="s" />

      {isModalVisible ? (
        showGeneratedList ? (
          <EuiModal onClose={closeModal} style={{ width: 800 }}>
            <EuiModalHeader>
              <EuiModalHeaderTitle>
                <h1>Create IOC List</h1>
              </EuiModalHeaderTitle>
            </EuiModalHeader>

            <EuiSpacer size="s" />

            <EuiModalBody>
              <data className="eui-yScroll">
                <div className="eui-textBreakWord">
                  <li>Title:{addStringWraping(IOCListTitle)}</li>
                  <li>File Name: {files ? files[0].name : ''}</li>
                  <li>Description: {IOCListDescription.length ? IOCListDescription : 'None'}</li>
                  <li>Additional Users: {selectedOptions.length ? getSelectedUser() : 'None'}</li>
                  {errors}
                </div>
              </data>

              <div id="gridcontainer">
                <EuiBasicTable
                  className="eui-xScroll"
                  tableCaption="Selectors"
                  items={pageOfItems}
                  pagination={pagination}
                  rowHeader="fieldName"
                  columns={columns}
                  rowProps={getRowProps}
                  cellProps={getCellProps}
                  onChange={onTableChange}
                />
              </div>
              <EuiSpacer size="s" />
            </EuiModalBody>
            <EuiSpacer size="s" />
            <EuiModalFooter>
              <EuiFlexGroup>
                <EuiFlexItem>
                  <EuiButton size="s" onClick={onSaveIOCList}>
                    Save List
                  </EuiButton>
                </EuiFlexItem>
                <EuiFlexItem>
                  <EuiCopy textToCopy={IOCDSLFilter}>
                    {(onSaveIOCList) => (
                      <EuiButton size="s" onClick={onSaveIOCList}>
                        Copy Filter
                      </EuiButton>
                    )}
                  </EuiCopy>
                </EuiFlexItem>
                <EuiFlexItem>
                  <EuiButton size="s" onClick={onBack}>
                    Back
                  </EuiButton>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiModalFooter>
          </EuiModal>
        ) : (
          <EuiModal onClose={closeModal}>
            <EuiModalHeader>
              <EuiModalHeaderTitle>
                <h1>Create IOC List </h1>
              </EuiModalHeaderTitle>
            </EuiModalHeader>
            <EuiModalBody>
              <EuiFieldText
                isInvalid={isIOCListNameInvalid}
                placeholder="List Title"
                value={IOCListTitle}
                onChange={(e) => setIOCListTitle(e.target.value)}
                aria-label="Use aria labels when no actual label is in use"
              />
              <EuiTextArea
                placeholder="Description"
                value={IOCListDescription}
                onChange={(e) => setIOCListDescription(e.target.value)}
                aria-label="Use aria labels when no actual label is in use"
              />
              {descriptionCount}

              <EuiSpacer size="s" />
              <EuiFilePicker
                display="large"
                onChange={onFilePickerChange}
                isInvalid={fileIsInvalid}
              />
              {/* Accordion buttons to add additional users to the permissions of the list  */}
              <EuiAccordion
                id={simpleAccordionId}
                buttonContent={text}
                className="additionalUserList"
                initialIsOpen={true}
              >
                <EuiComboBox
                  noSuggestions
                  placeholder="Enter username/s"
                  selectedOptions={selectedOptions}
                  onCreateOption={onCreateOption}
                  onChange={onChange}
                  onSearchChange={onSearchChange}
                  isInvalid={isInvalid}
                />
              </EuiAccordion>
              <EuiSpacer size="s" />
              <EuiButton
                fullWidth
                size="s"
                onClick={onGenerateList}
                isLoading={generateListIsLoading}
              >
                Generate List
              </EuiButton>
            </EuiModalBody>
            <div style={{ display: 'flex' }}>
              <EuiButtonEmpty
                onClick={get}
                iconType="tokenFile"
                iconSize="m"
                size="s"
                style={{ justifyContent: 'flex-end' }}
              >
                CSV Format
              </EuiButtonEmpty>
            </div>
          </EuiModal>
        )
      ) : (
        <div></div>
      )}
    </div>
  );
};

export default CreateIOCList;
