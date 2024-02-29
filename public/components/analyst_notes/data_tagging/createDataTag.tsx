import {
  EuiAccordion,
  EuiBadge,
  EuiButton,
  EuiButtonEmpty,
  EuiComboBox,
  EuiConfirmModal,
  EuiFieldText,
  EuiIconTip,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiSpacer,
  EuiText,
  EuiTextArea,
} from '@elastic/eui';
import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { getCore, getCurrentUser } from '../../../services';
import { isValid } from '../../../../common/helpers';

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

interface CreateDataTagProps {
  pushTagToCurrentTags: (tag: string) => void;
  closeModal: () => void;
  getTags: () => void;
  username: string;
  currentTags: string[];
}

const CreateDataTag = (Props: CreateDataTagProps) => {
  let [createConfirm, setCreateConfirm] = useState<boolean>(false);
  const [createTagField, setCreateTagField] = useState('');
  const [createDetailsField, setCreateDetailsField] = useState('');
  const [tagInvalid, setTagInvalid] = useState(false);
  const [hideFormError, setHideFormError] = useState(true);
  const [formErrorMessage, setFormErrorMessage] = useState('');
  const [isInvalid, setIsInvalid] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<{ label: string }[]>([]);

  const toastMessageSuccess = (message: string | JSX.Element, timer: number) => {
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

  const toastMessageWarning = (message: string | JSX.Element, timer: number) => {
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

  const closeSubmodal = () => {
    setCreateConfirm(false);
  };

  const setInvalid = (value: boolean) => {
    setIsInvalid(value);
  };

  const selectedOptionsToStrings = () => {
    let retval: string[] = [];

    selectedOptions.forEach((user) => {
      retval.push(user.label);
    });

    return retval;
  };

  const onCreateConfirm = async () => {
    const core = getCore();
    const user = getCurrentUser();

    //check to see if the tag name was created somewhere else if so toast the user
    if (await listNameDuplicateChecker()) {
      //Create parameters for API
      let tag = JSON.stringify({
        username: user.username,
        tag: createTagField.trim(),
        details: createDetailsField,
        users: selectedOptionsToStrings(), //selectedOptions needs to be an array of object {label: string} we have to convert these before sending them
        //timstamp is created by the server
        //owner is obtained by the server as well
      });

      //Execute API call
      core.http
        .put('/api/spitting_alpaca/createtag', { body: JSON.stringify(tag) })
        .then(async (res: any) => {
          console.log(res);

          //API success
          if (res.status.statusCode == 200) {
            toastMessageSuccess(
              <EuiText>
                Tag <EuiBadge color="primary">{createTagField}</EuiBadge> Added Successfully
              </EuiText>,
              3000
            );

            Props.pushTagToCurrentTags(createTagField.trim());
            Props.closeModal();
            closeSubmodal();
            await Props.getTags();
            // this.setState({ tableRows: [] });
            //API failure
          } else {
            toastMessageWarning(
              <EuiText>
                Failed to add Tag
                <EuiBadge color="primary">{createTagField}</EuiBadge>
              </EuiText>,
              3000
            );
          }
        })

        //API error
        .catch((err) => {
          console.log(err);
          toastMessageWarning(
            <EuiText>
              Failed to add Tag
              <EuiBadge color="primary">{createTagField}</EuiBadge>
            </EuiText>,
            3000
          );
        });
    } else {
      toastMessageWarning(
        <EuiText>
          Tag not created, already exist in index
          <EuiBadge color="primary">{createTagField}</EuiBadge>
        </EuiText>,
        3000
      );
    }
  };

  const listNameDuplicateChecker = async () => {
    let core = getCore();

    var options = {
      body: JSON.stringify({
        tag: createTagField.trim(),
      }),
    };

    var checkerStatus;

    await core.http.post('/api/spitting_alpaca/checkdatatagname', options).then((res: any) => {
      //true, the list name already exist
      //false the list name doesnt exist
      checkerStatus = res.status;
    });
    // console.log(checkerStatus);
    return checkerStatus;
  };

  let submodal;

  if (createConfirm) {
    submodal = (
      <EuiConfirmModal
        title="Please Confirm Your Tag"
        onCancel={closeSubmodal}
        onConfirm={onCreateConfirm}
        cancelButtonText="I need to change it"
        confirmButtonText="Looks Good"
        defaultFocusedButton="confirm"
      >
        <dl className="eui-definitionListReverse">
          <dt>Tag Name:</dt>
          <dd>{createTagField}</dd>
          <dt>Details:</dt>
          <dd style={createDetailsField.length < 1 ? { color: 'gray' } : { color: 'white' }}>
            {createDetailsField.length < 1 ? '(Field empty)' : createDetailsField}
          </dd>
          <dt>Users:</dt>
          <dd style={createDetailsField.length < 1 ? { color: 'gray' } : { color: 'white' }}>
            {selectedOptions.length < 1 ? '(Field Empty)' : selectedOptionsToStrings().toString()}
          </dd>
        </dl>
        <p>Does your tag look correct?</p>
      </EuiConfirmModal>
    );
  }

  const setFormError = (formErrorMessage: string) => {
    setFormErrorMessage(formErrorMessage);
    setHideFormError(false);
  };

  const clearFormError = () => {
    setFormErrorMessage('');
    setHideFormError(true);
  };

  const onChangeCreateTagField = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagInvalid(false);
    clearFormError();
    checkTag(e.target.value);
    setCreateTagField(e.target.value);
  };

  const checkTag = (tag: string) => {
    //Check tag length
    if (tag.length > 32) {
      setFormError('Tag name exceeds 32 characters');
      setTagInvalid(true);
    }

    //Check for duplicate tags

    let match = Props.currentTags.some((e) => {
      return e.trim() === tag.trim();
    });
    if (match) {
      // console.log('Tags match');
      setFormError('Tag name already exists, try a different tag name');
      setTagInvalid(true);
    }
  };

  const onChangeCreateDetailsField = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCreateDetailsField(e.target.value);
  };

  const onCreateSubmit = () => {
    //Check for empty tag
    if (createTagField.length < 1) {
      setTagInvalid(true);
      setFormError('Field required: Tag name');
    } else if (!tagInvalid) {
      setCreateConfirm(true);
    }

    //create the submit api for the Userworkspace
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
    setSelectedOptions([...selectedOptions, newOption]);
  };

  const onAdditionalUserSearchChange = (searchValue: any) => {
    if (!searchValue) {
      setInvalid(false);

      return;
    }

    setInvalid(!isValid(searchValue));
  };

  const onAdditionalUserChange = (list: { label: string }[]) => {
    setSelectedOptions(list);
    setInvalid(false);
  };

  return (
    <EuiModal onClose={Props.closeModal}>
      <EuiModalHeader>
        <EuiModalHeaderTitle>Create Tag</EuiModalHeaderTitle>
      </EuiModalHeader>

      <EuiModalBody>
        <EuiText>
          <p>Tag name</p>
        </EuiText>
        <EuiFieldText
          placeholder="Tag name"
          isInvalid={tagInvalid}
          value={createTagField}
          onChange={(e) => onChangeCreateTagField(e)}
        />
        <EuiSpacer size="s" />
        <EuiText>
          <p>Details (optional)</p>
        </EuiText>
        <EuiTextArea
          placeholder="Tag details"
          value={createDetailsField}
          onChange={(e) => onChangeCreateDetailsField(e)}
        />
        <EuiText color="danger" hidden={hideFormError} size="s">
          <p>{formErrorMessage}</p>
        </EuiText>
        <EuiAccordion
          id={'EuiUserAccordion'}
          buttonContent={text}
          className="additionalUserList"
          initialIsOpen={true}
        >
          <EuiComboBox
            noSuggestions
            placeholder="Enter username/s"
            selectedOptions={selectedOptions}
            onCreateOption={onCreateOption}
            onChange={onAdditionalUserChange}
            onSearchChange={onAdditionalUserSearchChange}
            isInvalid={isInvalid}
          />
        </EuiAccordion>
      </EuiModalBody>

      <EuiModalFooter>
        <EuiButtonEmpty onClick={Props.closeModal}>Close</EuiButtonEmpty>
        <EuiButton onClick={onCreateSubmit} fill>
          Submit
        </EuiButton>
      </EuiModalFooter>
      {submodal}
    </EuiModal>
  );
};

export default CreateDataTag;
