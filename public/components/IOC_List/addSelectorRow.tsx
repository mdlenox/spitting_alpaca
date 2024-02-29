import React from 'react';
import {
  EuiFieldText,
  EuiFormRow,
  EuiPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiButtonIcon,
  EuiSpacer,
} from '@elastic/eui';

interface FilterProps {
  deleteAddSelector: (rowKey: number) => void;
  rowKey: number;
  updateTextField: (n: number, value: any) => void;
  updateTextSelector: (n: number, value: any) => void;
  updateTextNote: (n: number, value: any) => void;
  updateTextFlag: (n: number, value: any) => void;
  fieldValue: string;
  flagValue: string;
  selectorValue: string;
  noteValue: string;
  isFieldInvalid: boolean;
  isSelectorInvalid: boolean;
}

const AddSelectorRow: React.FC<FilterProps> = (props: FilterProps) => (
  <div>
    <EuiPanel>
      <EuiFormRow display="rowCompressed">
        <div>
          <EuiFlexGroup>
            <EuiFlexItem grow={true}>
              <EuiFormRow label="Field">
                <EuiFieldText
                  style={{ width: 120 }}
                  onChange={(e) => {
                    props.updateTextField(props.rowKey, e);
                  }}
                  value={props.fieldValue}
                  isInvalid={props.isFieldInvalid}
                ></EuiFieldText>
              </EuiFormRow>
            </EuiFlexItem>
            <EuiFlexItem grow={true}>
              <EuiFormRow label="Selector">
                <EuiFieldText
                  style={{ width: 150 }}
                  onChange={(e) => {
                    props.updateTextSelector(props.rowKey, e);
                  }}
                  value={props.selectorValue}
                  isInvalid={props.isSelectorInvalid}
                ></EuiFieldText>
              </EuiFormRow>
            </EuiFlexItem>
            <EuiFlexItem grow={true}>
              <EuiFormRow label="Flag">
                <EuiFieldText
                  style={{ width: 100 }}
                  onChange={(e) => {
                    props.updateTextFlag(props.rowKey, e);
                  }}
                  value={props.flagValue}
                ></EuiFieldText>
              </EuiFormRow>
            </EuiFlexItem>
            <EuiFlexItem grow={true}>
              <EuiFormRow label="Note">
                <EuiFieldText
                  style={{ width: 200 }}
                  onChange={(e) => {
                    props.updateTextNote(props.rowKey, e);
                  }}
                  value={props.noteValue}
                ></EuiFieldText>
              </EuiFormRow>
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiButtonIcon
                aria-label="minus"
                iconType={'minusInCircle'}
                onClick={() => {
                  props.deleteAddSelector(props.rowKey);
                }}
              ></EuiButtonIcon>
            </EuiFlexItem>
          </EuiFlexGroup>
        </div>
      </EuiFormRow>
    </EuiPanel>
    <EuiSpacer size="s" />
  </div>
);

export default AddSelectorRow;
