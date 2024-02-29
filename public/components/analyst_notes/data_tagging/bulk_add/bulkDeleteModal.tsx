import {
  EuiButton,
  EuiButtonEmpty,
  EuiComboBox,
  EuiComboBoxOptionOption,
  EuiConfirmModal,
  EuiEmptyPrompt,
  EuiLoadingLogo,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import React, { useState } from 'react';
import { getCore } from '../../../../services';

interface BulkDeleteModalProps {
  closeModal: () => void;
  addOptions: EuiComboBoxOptionOption[];
  queryJson: string;
  queryIndex: string;
}

const docCountLimit = 200000;

const BulkDeleteModal = (Props: BulkDeleteModalProps) => {
  let [deleteConfirm, setDeleteConfirm] = useState<boolean>(false);
  let [selectedOptions, setSelectedOptions] = useState<EuiComboBoxOptionOption[]>([]);
  let [tagInvalid, setTagInvalid] = useState<boolean>(false);
  let [formErrorMessage, setFormErrorMessage] = useState<string>('');
  let [hideFormError, setHideFormError] = useState<boolean>(true);
  let [modalState, setModalState] = useState<string>('AddTag');
  let [queryError, setQueryError] = useState<string>('');
  let [docCount, setDocCount] = useState<number>(0);
  let [executionTime, setExecutionTime] = useState<number>(0);
  let [currentBatch, setCurrentBatch] = useState<number>(0);
  let [batchCount, setBatchCount] = useState<number>(0);

  const onChangeAdd = (e: any) => {
    setSelectedOptions(e);
    setHideFormError(true);
    setTagInvalid(false);
  };

  const onAddSubmit = async () => {
    //Check for empty tag
    if (selectedOptions.length < 1) {
      setTagInvalid(true);
      setFormErrorMessage('No tags selected');
      setHideFormError(false);
    } else if (!tagInvalid) {
      //call the loading screen, get the document count and then display the proper screen
      setModalState('LoadingCount');

      const core = getCore();

      let options = {
        body: JSON.stringify({
          queryJson: Props.queryJson,
          queryIndex: Props.queryIndex,
        }),
      };
      await core.http
        .post('/api/spitting_alpaca/getdoccount', options)
        .then((res: any) => {
          console.log(res);
          try {
            const resultCount = res.response.body.count;
            setDocCount(res.response.body.count);

            console.log('doc count ');
            console.log(resultCount);

            if (resultCount == 0) {
              setQueryError('No Documents Found');
              setModalState('QueryError');
            } else if (resultCount > 0 && resultCount <= docCountLimit) {
              setModalState('Confirm');
            } else if (resultCount > docCountLimit) {
              console.log('count limit reached');

              setQueryError(
                'Documents returned exceed 200,000. Please change the query so that less documents are returned.'
              );
              setModalState('QueryError');
            }
          } catch (err) {
            setQueryError(err);
            setModalState('QueryError');
          }
        })
        .catch((err) => {
          console.log(err);
          setQueryError(err);
          setModalState('QueryError');
        });
    }
  };

  const onAddConfirm = async () => {
    //this will be the batch size for the update api call
    const core = getCore();
    const batchSize: number = 5000;
    let tagCountInDocuments: number = 0;
    let tags: string[] = [];
    let startTime = Date.now();

    setModalState('DeleteTags');

    //creating the query so that only documents with tags that will be deleted will return
    let parsedQuery = JSON.parse(Props.queryJson);
    let query: any = {
      bool: {
        should: [],
        minimum_should_match: 1,
      },
    };
    //form the query for the update

    //iteratre through each tag that has been selected and add it to the query in a filter clause
    selectedOptions.forEach((tag) => {
      query.bool.should.push({
        match_phrase: {
          analyst_tags: tag.label,
        },
      });
      tags.push(tag.label);
    });

    parsedQuery.bool.filter.push(query);

    let getTagsCountInDocumentsOptions = {
      body: JSON.stringify({
        index: Props.queryIndex,
        query: JSON.stringify(parsedQuery),
      }),
    };

    await core.http
      .post('/api/spitting_alpaca/gettagcountindocuments', getTagsCountInDocumentsOptions)
      .then(async (res: any) => {
        console.log(res);
        tagCountInDocuments = res.response.body.count;
      });

    //get the proper batch count
    let batchCount: number = Math.ceil(tagCountInDocuments / batchSize);
    let count: number = 0;
    setBatchCount(batchCount);

    //batch the updates
    let options = {
      body: JSON.stringify({
        tags: tags,
        query: JSON.stringify(parsedQuery),
        index: Props.queryIndex,
        batchSize: batchSize,
      }),
    };

    for (let i = tagCountInDocuments; i > 0; ) {
      setCurrentBatch(count);

      await core.http
        .post('/api/spitting_alpaca/batchdeletetags', options)
        .then(async (res: any) => {
          console.log(res);
        });

      count++;
      i -= batchSize;
    }

    setExecutionTime((Date.now() - startTime) / 1000);

    setModalState('Results');
  };

  const pointlessFunction = () => {};

  const closeSubmodal = () => {
    setDeleteConfirm(false);
    setModalState('AddTag');
  };

  let modal;

  let submodal;

  if (deleteConfirm) {
    submodal = (
      <EuiConfirmModal
        title="Please Confirm Your Tag Selection"
        onCancel={closeSubmodal}
        onConfirm={onAddConfirm}
        cancelButtonText="I need to change it"
        confirmButtonText="Delete Tag/s"
        defaultFocusedButton="confirm"
      >
        <dl className="eui-definitionListReverse">
          <dt>Selected Tags:</dt>
          <dd>
            {selectedOptions.map((item) => (
              <li>{item.label}</li>
            ))}
          </dd>
        </dl>
        <p>Does your tag selection look correct?</p>
      </EuiConfirmModal>
    );
  }

  //Add submodal (confirmation)
  switch (modalState) {
    case 'Confirm':
      modal = (
        <EuiConfirmModal
          title="Please Confirm Your Tag Selection"
          onCancel={closeSubmodal}
          onConfirm={onAddConfirm}
          cancelButtonText="I need to change it"
          confirmButtonText="Delete Tag/s"
          defaultFocusedButton="confirm"
        >
          <dl className="eui-definitionListReverse">
            <dt>Selected Tags:</dt>
            <dd>
              {selectedOptions.map((item) => (
                <li>{item.label}</li>
              ))}
            </dd>
          </dl>
          <p>Does your tag selection look correct?</p>
        </EuiConfirmModal>
      );
      break;
    case 'QueryError':
      //create a error modal
      modal = (
        <div>
          <EuiSpacer size="m" />(
          <EuiModal onClose={Props.closeModal}>
            <EuiSpacer size="l" />
            <EuiModalBody>
              <EuiEmptyPrompt
                iconType="cross"
                color="danger"
                title={<h2>Issue Deleting Tag/s </h2>}
                body={<p>{queryError}</p>}
              />
            </EuiModalBody>
            <EuiSpacer size="l" />
            <EuiModalFooter>
              <EuiButton onClick={Props.closeModal}>Close</EuiButton>
            </EuiModalFooter>
          </EuiModal>
        </div>
      );
      break;
    case 'LoadingCount':
      modal = (
        <EuiModal onClose={pointlessFunction}>
          <EuiModalBody>
            <EuiEmptyPrompt
              icon={<EuiLoadingLogo logo="logoKibana" size="xl" />}
              title={<h2>Getting Document Count</h2>}
            />
          </EuiModalBody>
        </EuiModal>
      );
      break;
    case 'Results':
      modal = (
        <EuiModal onClose={Props.closeModal}>
          <EuiModalBody>
            <EuiEmptyPrompt
              iconType={'tag'}
              title={<h2>Tags Deleted</h2>}
              body={
                <p>
                  <dl>
                    <dt>Deletion Stats:</dt>

                    <dd>
                      <dd>Execution Time: {executionTime} seconds</dd>
                    </dd>

                    <dd>Documents Present: {docCount}</dd>
                  </dl>

                  <dl className="eui-definitionListReverse">
                    <dt>Deleted Tags:</dt>
                    <dd>
                      {selectedOptions.map((item) => (
                        <li>{item.label}</li>
                      ))}
                    </dd>
                  </dl>
                </p>
              }
            />
          </EuiModalBody>
          <EuiModalFooter>
            <EuiButton onClick={Props.closeModal}>Close</EuiButton>
          </EuiModalFooter>
        </EuiModal>
      );
      break;
    case 'DeleteTags':
      modal = (
        <EuiModal onClose={pointlessFunction}>
          <EuiModalBody>
            <EuiEmptyPrompt
              icon={<EuiLoadingLogo logo="logoKibana" size="xl" />}
              title={<h2>Deleting Tags</h2>}
            />
          </EuiModalBody>
          <EuiModalFooter>
            {currentBatch} / {batchCount} Batches Complete
          </EuiModalFooter>
        </EuiModal>
      );
      break;
    case 'AddTag':
      modal = (
        <EuiModal onClose={Props.closeModal}>
          <EuiModalHeader>
            <EuiModalHeaderTitle>Delete Existing Tag</EuiModalHeaderTitle>
          </EuiModalHeader>

          <EuiModalBody>
            <EuiText>
              <p>Tags</p>
            </EuiText>
            <EuiComboBox
              placeholder="Click to select tags..."
              options={Props.addOptions}
              selectedOptions={selectedOptions}
              onChange={onChangeAdd}
              isClearable={true}
            />
            <EuiText color="danger" hidden={hideFormError} size="s">
              <p>{formErrorMessage}</p>
            </EuiText>
          </EuiModalBody>
          <EuiSpacer size="l" />
          <EuiModalFooter>
            <EuiButtonEmpty onClick={Props.closeModal}>Close</EuiButtonEmpty>
            <EuiButton onClick={onAddSubmit} fill>
              Submit
            </EuiButton>
          </EuiModalFooter>
        </EuiModal>
      );
      break;
    case 'None':
      modal = <div></div>;
      break;
    default:
      modal = <div></div>;
      break;
  }

  return (
    <div>
      {modal}
      {submodal}
    </div>
  );
};

export default BulkDeleteModal;
