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

const docCountLimit = 200000;

interface BulkAddModalProps {
  closeModal: () => void;
  addOptions: EuiComboBoxOptionOption[];
  queryJson: string;
  queryIndex: string;
}

const BulkAddModal = (Props: BulkAddModalProps) => {
  let [addConfirm, setAddConfirm] = useState<boolean>(false);
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
            const docCount = res.response.body.count;
            setDocCount(res.response.body.count);

            if (docCount == 0) {
              setQueryError('No Documents Found');
              setModalState('QueryError');
            } else if (docCount > 0 && docCount <= docCountLimit) {
              //setModalState('Confirm');
              setAddConfirm(true);
            } else if (docCount > docCountLimit) {
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

    setModalState('GettingCount');

    //creating the query so that only documents with tags that will be deleted will return
    let parsedQuery = JSON.parse(Props.queryJson);
    let selectedTagQueryPortion: any = {
      bool: {
        should: [],
        minimum_should_match: 1,
      },
    };

    //form the query for the update
    let batchQuery: any = JSON.parse(Props.queryJson);
    console.log('query');
    console.log(Props.queryJson);
    let filter: any = {
      bool: {
        must_not: {
          bool: {
            filter: [],
          },
        },
      },
    };

    //iteratre through each tag that has been selected and add it to the query in a filter clause
    selectedOptions.forEach((tag) => {
      selectedTagQueryPortion.bool.should.push({
        match_phrase: {
          analyst_tags: tag.label,
        },
      });
      tags.push(tag.label);
      filter.bool.must_not.bool.filter.push({
        bool: {
          should: [
            {
              match: {
                analyst_tags: tag.label,
              },
            },
          ],
          minimum_should_match: 1,
        },
      });
    });

    batchQuery.bool.filter.push(filter);
    parsedQuery.bool.filter.push(selectedTagQueryPortion);

    let getTagsCountInDocumentsOptions = {
      body: JSON.stringify({
        index: Props.queryIndex,
        query: JSON.stringify(batchQuery),
      }),
    };

    await core.http
      .post('/api/spitting_alpaca/gettagcountindocuments', getTagsCountInDocumentsOptions)
      .then(async (res: any) => {
        console.log(res);
        tagCountInDocuments = res.response.body.count;
        setDocCount(tagCountInDocuments);
      });

    //get the proper batch count
    let batchCount: number = Math.ceil(tagCountInDocuments / batchSize);
    let count: number = 0;
    setBatchCount(batchCount);

    setModalState('AddingTags');

    //batch the updates
    let options = {
      body: JSON.stringify({
        tags: tags,
        query: JSON.stringify(batchQuery),
        index: Props.queryIndex,
        batchSize: batchSize,
      }),
    };

    for (let i = tagCountInDocuments; i > 0; ) {
      setCurrentBatch(count);

      await core.http
        .post('/api/spitting_alpaca/batchupdatetags', options)
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
    setAddConfirm(false);
    setModalState('AddTag');
  };

  let modal;

  let submodal;

  if (addConfirm) {
    submodal = (
      <EuiConfirmModal
        title="Please Confirm Your Tag Selection"
        onCancel={closeSubmodal}
        onConfirm={onAddConfirm}
        cancelButtonText="I need to change it"
        confirmButtonText="Add Tag/s"
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
          onCancel={Props.closeModal}
          onConfirm={onAddConfirm}
          cancelButtonText="I need to change it"
          confirmButtonText="Add Tag/s"
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
                title={<h2>Issue Adding Tag/s</h2>}
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
        <EuiModal onClose={Props.closeModal}>
          <EuiModalBody>
            <EuiEmptyPrompt
              icon={<EuiLoadingLogo logo="logoKibana" size="xl" />}
              title={<h2>Getting Params Count</h2>}
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
              title={<h2>Tags Added</h2>}
              body={
                <p>
                  <dl>
                    <dt>Append Stats:</dt>
                    <dd>Execution Time: {executionTime} seconds</dd>
                    <dd>Documents Present: {docCount}</dd>
                  </dl>

                  <dl className="eui-definitionListReverse">
                    <dt>Appened Tags:</dt>
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
    case 'AddingTags':
      modal = (
        <EuiModal onClose={pointlessFunction}>
          <EuiModalBody>
            <EuiEmptyPrompt
              icon={<EuiLoadingLogo logo="logoKibana" size="xl" />}
              title={<h2>Adding Tags</h2>}
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
            <EuiModalHeaderTitle>Add Existing Tag</EuiModalHeaderTitle>
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

export default BulkAddModal;
