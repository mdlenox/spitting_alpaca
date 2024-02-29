import {
  EuiButton,
  EuiButtonEmpty,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
} from '@elastic/eui';
import React from 'react';
import { Component } from 'react';
import AddSelectorRow from './addSelectorRow';

interface ASMProps {
  closeAddSelectorModal: () => void;
  addAppendList: (
    list: {
      id: number;
      fieldName: string | null | undefined;
      fieldValue: string;
      flag: string;
      note: string;
      online: boolean;
    }[]
  ) => void;
}

interface ASMState {
  addSelectorsList: {
    field: string;
    isFieldInvalid: boolean;
    selector: string;
    isSelectorInvalid: boolean;
    rowKey: number;
    flag: string;
    note: string;
  }[];
}

export class AddSelectorModal extends Component<ASMProps, ASMState> {
  constructor(props: ASMProps) {
    super(props);

    this.state = {
      addSelectorsList: [
        {
          field: '',
          isFieldInvalid: false,
          selector: '',
          isSelectorInvalid: false,
          flag: '',
          rowKey: 0,
          note: '',
        },
      ],
    };
  }

  deleteAddSelectorRow = (rowKey: number) => {
    let tempList: {
      field: string;
      isFieldInvalid: boolean;
      selector: string;
      isSelectorInvalid: boolean;
      rowKey: number;
      flag: string;
      note: string;
    }[] = this.state.addSelectorsList.filter((row) => row.rowKey !== rowKey);

    let tempList2: {
      field: string;
      isFieldInvalid: boolean;
      selector: string;
      isSelectorInvalid: boolean;
      rowKey: number;
      flag: string;
      note: string;
    }[] = [];

    tempList.map((row, index) => {
      tempList2.push({
        field: row.field,
        isFieldInvalid: row.isFieldInvalid,
        selector: row.selector,
        isSelectorInvalid: row.isSelectorInvalid,
        rowKey: index,
        note: row.note,
        flag: row.flag,
      });
    });

    this.setState({ addSelectorsList: tempList2 });
  };

  addSelectorRow = () => {
    // console.log('test');
    let tempList = this.state.addSelectorsList;

    if (this.state.addSelectorsList.length == 0) {
      tempList.push({
        field: '',
        isFieldInvalid: false,
        selector: '',
        isSelectorInvalid: false,
        rowKey: 0,
        flag: '',
        note: '',
      });
    } else {
      tempList.push({
        field: '',
        isFieldInvalid: false,
        selector: '',
        isSelectorInvalid: false,
        rowKey: this.state.addSelectorsList.length,
        flag: '',
        note: '',
      });
    }

    this.setState({ addSelectorsList: tempList });
    // console.log(this.state.addSelectorsList);
  };

  updateTextSelector = (key: number, textValue: any) => {
    let tempFilters = this.state.addSelectorsList;
    let text = textValue.target.value;

    // console.log('Key:' + key);

    tempFilters.splice(key, 1, {
      field: this.state.addSelectorsList[key].field,
      isFieldInvalid: this.state.addSelectorsList[key].isFieldInvalid,
      selector: text,
      isSelectorInvalid: this.state.addSelectorsList[key].isSelectorInvalid,
      rowKey: key,
      flag: this.state.addSelectorsList[key].flag,
      note: this.state.addSelectorsList[key].note,
    });

    this.setState({ addSelectorsList: tempFilters });
  };

  updateTextFlag = (key: number, textValue: any) => {
    let tempFilters = this.state.addSelectorsList;
    let text = textValue.target.value;

    // console.log('Key:' + key);

    tempFilters.splice(key, 1, {
      field: this.state.addSelectorsList[key].field,
      isFieldInvalid: this.state.addSelectorsList[key].isFieldInvalid,
      selector: this.state.addSelectorsList[key].selector,
      isSelectorInvalid: this.state.addSelectorsList[key].isSelectorInvalid,
      flag: text,
      rowKey: key,
      note: this.state.addSelectorsList[key].note,
    });

    this.setState({ addSelectorsList: tempFilters });
  };

  updateTextNote = (key: number, textValue: any) => {
    let tempFilters = this.state.addSelectorsList;
    let text = textValue.target.value;

    // console.log('Key:' + key);

    tempFilters.splice(key, 1, {
      field: this.state.addSelectorsList[key].field,
      isFieldInvalid: this.state.addSelectorsList[key].isFieldInvalid,
      selector: this.state.addSelectorsList[key].selector,
      isSelectorInvalid: this.state.addSelectorsList[key].isSelectorInvalid,
      rowKey: key,
      flag: this.state.addSelectorsList[key].flag,
      note: text,
    });

    this.setState({ addSelectorsList: tempFilters });
  };

  updateTextField = (key: number, textValue: any) => {
    let tempFilters = this.state.addSelectorsList;
    let text = textValue.target.value;

    tempFilters.splice(key, 1, {
      field: text,
      isFieldInvalid: this.state.addSelectorsList[key].isFieldInvalid,
      selector: this.state.addSelectorsList[key].selector,
      isSelectorInvalid: this.state.addSelectorsList[key].isSelectorInvalid,
      rowKey: key,
      flag: this.state.addSelectorsList[key].flag,
      note: this.state.addSelectorsList[key].note,
    });

    this.setState({ addSelectorsList: tempFilters });
  };

  checkList = () => {
    let checkedList: {
      field: string;
      isFieldInvalid: boolean;
      selector: string;
      isSelectorInvalid: boolean;
      rowKey: number;
      note: string;
      flag: string;
    }[] = [];

    let retval: boolean = true;

    this.state.addSelectorsList.forEach((row) => {
      let trimmedField: string = row.field.trim();
      let trimmedSelector: string = row.selector.trim();

      let fieldIsInvalidValue: boolean = false;
      let selectorIsInvalidValue: boolean = false;

      //check for null, empty, trim
      if (trimmedField.length == 0) {
        retval = false;
        fieldIsInvalidValue = true;
      }
      if (trimmedSelector.length == 0) {
        retval = false;
        selectorIsInvalidValue = true;
      }

      //add the trimmed values and the update isValid Values so the list reflects the invalid fields and selectors
      checkedList.push({
        field: trimmedField,
        isFieldInvalid: fieldIsInvalidValue,
        selector: trimmedSelector,
        isSelectorInvalid: selectorIsInvalidValue,
        rowKey: row.rowKey,
        note: row.note,
        flag: row.flag,
      });
    });

    this.setState({ addSelectorsList: checkedList });
    return retval;
  };

  formateList = (
    addSelectorsList: {
      field: string;
      isFieldInvalid: boolean;
      selector: string;
      isSelectorInvalid: boolean;
      rowKey: number;
      flag: string;
      note: string;
    }[]
  ) => {
    let list: {
      id: number;
      fieldName: string | null | undefined;
      fieldValue: string;
      online: boolean;
      note: string;
      flag: string;
    }[] = [];

    this.state.addSelectorsList.forEach((row) => {
      list.push({
        id: row.rowKey,
        fieldName: row.field.replace('\u200b', ''),
        fieldValue: row.selector.replace('\u200b', ''),
        online: true,
        flag: row.flag.replace('\u200b', ''),
        note: row.note.replace('\u200b', ''),
      });
    });

    return list;
  };

  render() {
    return (
      <div>
        <EuiModal onClose={this.props.closeAddSelectorModal} style={{ width: 1200, height: 700 }}>
          <EuiModalHeader>
            <EuiModalHeaderTitle>Add Selector/s</EuiModalHeaderTitle>
            <EuiButtonEmpty
              aria-label="plus"
              iconType={'plusInCircle'}
              onClick={this.addSelectorRow}
            >
              Add row
            </EuiButtonEmpty>
          </EuiModalHeader>
          <EuiModalBody>
            {this.state.addSelectorsList.map((addSelector) => (
              <div>
                <AddSelectorRow
                  deleteAddSelector={() => {
                    this.deleteAddSelectorRow(addSelector.rowKey);
                  }}
                  rowKey={addSelector.rowKey}
                  updateTextField={this.updateTextField}
                  updateTextSelector={this.updateTextSelector}
                  updateTextNote={this.updateTextNote}
                  fieldValue={addSelector.field}
                  selectorValue={addSelector.selector}
                  isFieldInvalid={addSelector.isFieldInvalid}
                  isSelectorInvalid={addSelector.isSelectorInvalid}
                  noteValue={addSelector.note}
                  updateTextFlag={this.updateTextFlag}
                  flagValue={addSelector.flag}
                ></AddSelectorRow>
              </div>
            ))}
          </EuiModalBody>
          <EuiModalFooter>
            <EuiButtonEmpty onClick={this.props.closeAddSelectorModal}>Exit</EuiButtonEmpty>

            <EuiButton
              type="submit"
              onClick={() => {
                if (this.checkList()) {
                  //check to see if there are any erros in list before they are saved
                  this.props.addAppendList(this.formateList(this.state.addSelectorsList));
                }
              }}
              fill
            >
              Save Selectors
            </EuiButton>
          </EuiModalFooter>
        </EuiModal>
      </div>
    );
  }
}
