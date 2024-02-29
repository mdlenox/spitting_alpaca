import {
  EuiBasicTable,
  EuiButton,
  EuiButtonEmpty,
  EuiConfirmModal,
  EuiFilePicker,
  EuiFlexGroup,
  EuiFlexItem,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiSpacer,
  EuiSwitch,
  EuiSwitchEvent,
  EuiText,
  EuiTextColor,
} from '@elastic/eui';
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { getCore } from '../../services';

interface appendListProps {
  closeAppendList: () => void;
  addAppendList: (
    list: {
      id: number;
      fieldName: string | null | undefined;
      fieldValue: string;
      note: string;
      flag: string;
      online: boolean;
    }[]
  ) => void;
  deleteList: (
    list: {
      id: number;
      fieldName: string | null | undefined;
      fieldValue: string;
      note: string;
      flag: string;
      online: boolean;
    }[]
  ) => void;
}

const AppendList = (Props: appendListProps) => {
  const [files, setFiles] = useState<FileList | undefined | null>(undefined);
  const [IOCList, setIOCList] = useState<
    {
      id: number;
      fieldName: string | null | undefined;
      fieldValue: string;
      online: boolean;
      flag: string;
      note: string;
    }[]
  >([]);
  const [fileIsInvalid, setFileIsInvalid] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(true);
  const [fileErrorCount, setFileErrorCount] = useState<number[]>([]);
  const [showGeneratedList, setShowGeneratedList] = useState(false);
  const [generateListIsLoading, setGenerateListIsLoading] = useState(false);
  const [appendOrDeleteSwitchOption, setAppendOrDeleteSwitchOption] = useState<boolean>(true);
  const [isConfirmationModal, setIsConfirmationModal] = useState<boolean>(false);

  useEffect(() => {
    // console.log('trying 0async');
    if (generateListIsLoading) {
      // console.log('3');
      setFileIsInvalid(false);

      setShowGeneratedList(true);
    }
  }, [generateListIsLoading]);

  const onGenerateList = async () => {
    //checking to see if the filename alreay exists

    //checking to see if the file is null and if so set it to isinvalid true
    if (files == undefined || files.length == 0) {
      //there is no file selected or a file with of the wrong type was selected and it didnt load the file in since it was the wrong type in filechanger
      setFileIsInvalid(true);

      return;
    } else {
      // console.log('Processing File:' + files[0].name);
      setGenerateListIsLoading(true); //set the loading button
    }
  };

  const closeModal = () => {
    Props.closeAppendList();
    setIsModalVisible(false);
    setIOCList([]);
    setFiles(undefined);
    setFileErrorCount([]);
    setFileIsInvalid(false);
    setShowGeneratedList(false);
    setGenerateListIsLoading(false);
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
        id: number;
        fieldName: string | null | undefined;
        fieldValue: string;
        note: string;
        flag: string;
        online: boolean;
      }[] = [];
      var values = fileData.split(/\n/).filter(Boolean);
      let count = 0;
      let errors: number[] = [];

      values.forEach((element: string) => {
        count++; //count for what row it is iterating on
        let tempElement: {
          id: number;
          fieldName: string | null | undefined;
          fieldValue: string;
          online: boolean;
          note: string;
          flag: string;
        } = {
          id: 0,
          fieldName: '',
          fieldValue: '',
          flag: '',
          note: '',
          online: true,
        };
        let headers = element.split(',');
        let fields = element.split(',');
        let fieldName = fields[0];
        let fieldValue = fields[1];

        //checking to see if the fieldname or fieldvalue is null, if so add the row number to an array
        if (fieldName.length == 0 || fieldValue.length == 0) {
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

        tempElement.id = count;
        tempElement.fieldName = fieldName;
        tempElement.fieldValue = fieldValue;
        tempElement.online = true;
        tempElement.flag = headers[2];
        tempElement.note = fields[3];

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
      id: number;
      fieldName: string | null | undefined;
      fieldValue: string;
      note: string;
      flag: string;
      online: boolean;
    }[]
  ) => {
    let updatedList: {
      id: number;
      fieldName: string | null | undefined;
      fieldValue: string;
      note: string;
      flag: string;
      online: boolean;
    }[] = [];

    list.forEach((row) => {
      let duplicateFlag: boolean = false;

      //iterate through the list and check for duplicates
      if (updatedList.length == 0) {
        updatedList.push({
          id: 1,
          fieldName: row.fieldName,
          fieldValue: row.fieldValue,
          note: row.note,
          flag: row.flag,
          online: true,
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
            id: updatedList.length + 1,
            fieldName: row.fieldName,
            fieldValue: row.fieldValue,
            note: row.note,
            flag: row.flag,
            online: true,
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

  const onAppendList = async () => {
    //check to see if the list name exists and if there are errors
    //if there are any errors the file will not be saved

    closeConfirmationModal();
    Props.addAppendList(IOCList);
    Props.closeAppendList();
  };

  const onDeleteList = () => {
    closeConfirmationModal();
    Props.deleteList(IOCList);
    Props.closeAppendList();
  };

  const onBack = () => {
    setShowGeneratedList(false);
    setFiles(undefined);
    setGenerateListIsLoading(false);
  };

  const getRowProps = (item: { id: any }) => {
    const { id } = item;
    return {
      'data-test-subj': `row-${id}`,
      className: 'customRowClass',
      onClick: () => {},
    };
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
      field: 'id',
      name: 'Row',
      truncateText: true,
      'data-test-subj': 'fieldNameCell',
    },
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

  const closeConfirmationModal = () => setIsConfirmationModal(false);
  const showConfirmationModal = () => setIsConfirmationModal(true);

  let errors = generateErrorList();

  const onSwitchChange = (e: EuiSwitchEvent) => {
    setAppendOrDeleteSwitchOption(e.target.checked);
    console.log(appendOrDeleteSwitchOption);
  };

  let confirmationModal;

  if (isConfirmationModal) {
    let title: string = appendOrDeleteSwitchOption ? 'Append List' : 'Delete List';

    confirmationModal = (
      <EuiConfirmModal
        title={title}
        onCancel={closeConfirmationModal}
        onConfirm={appendOrDeleteSwitchOption ? onAppendList : onDeleteList}
        cancelButtonText="Exit"
        confirmButtonText={appendOrDeleteSwitchOption ? 'Append' : 'Delete'}
        buttonColor="danger"
        defaultFocusedButton="confirm"
      >
        <p>The selected file will be appended to the existing IOC List.</p>
      </EuiConfirmModal>
    );
  }

  return (
    <div>
      {confirmationModal}
      {isModalVisible ? (
        showGeneratedList ? (
          <EuiModal onClose={Props.closeAppendList} style={{ width: 800 }}>
            <EuiModalHeader>
              <EuiModalHeaderTitle>
                <h1>Append List</h1>
              </EuiModalHeaderTitle>
            </EuiModalHeader>

            <EuiSpacer size="s" />

            <EuiModalBody>
              <data className="eui-yScrollWithShadows">
                <br />
                <br /> &emsp;&emsp; File Name: {files ? files[0].name : ''}
                <br />
                {errors}
                <br />
              </data>

              <div id="gridcontainer">
                <EuiBasicTable
                  className="eui-xScrollWithShadows"
                  tableCaption="Selectors"
                  items={IOCList}
                  rowHeader="fieldName"
                  columns={columns}
                  rowProps={getRowProps}
                  cellProps={getCellProps}
                />
              </div>
              <EuiSpacer size="s" />
            </EuiModalBody>
            <EuiSpacer size="s" />
            <EuiModalFooter>
              <EuiFlexGroup>
                <EuiFlexItem>
                  <EuiButton size="s" onClick={showConfirmationModal}>
                    {appendOrDeleteSwitchOption ? 'Append Selectors' : 'Delete Selectors'}
                  </EuiButton>
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
                <EuiFlexItem>
                  <h1>Append List </h1>
                  <EuiSpacer size="s" />
                  <EuiSwitch
                    label={appendOrDeleteSwitchOption ? 'Append' : 'Delete'}
                    checked={appendOrDeleteSwitchOption}
                    onChange={(e) => onSwitchChange(e)}
                  />
                </EuiFlexItem>
              </EuiModalHeaderTitle>
            </EuiModalHeader>
            <EuiModalBody>
              <EuiFilePicker
                display="large"
                onChange={onFilePickerChange}
                isInvalid={fileIsInvalid}
              />
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

export default AppendList;
