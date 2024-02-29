import React, { Component } from 'react';
import { InspectorViewProps } from 'src/plugins/inspector/public/types';
import PropTypes from 'prop-types';
import { Request } from 'src/plugins/inspector/common/adapters/request/types';
import {
  EuiAccordion,
  EuiButton,
  EuiCard,
  EuiCodeBlock,
  EuiComboBoxOptionOption,
  EuiEmptyPrompt,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiLoadingLogo,
  EuiPanel,
  EuiSpacer,
  EuiTitle,
} from '@elastic/eui';
import CreateDataTag from '../createDataTag';
import { getCore } from '../../../../services';
import BulkAddModal from './bulkAddModal';
import BulkDeleteModal from './bulkDeleteModal';
import { DataTagHit } from 'plugins/spitting_alpaca/common/types';

export interface DataTag {
  id: number;
  tag: string;
  details: string;
  owner: string;
  users: string[];
  timestamp: string;
  _id: string;
}

interface RequestSelectorState {
  requests: Request[];
  request: any;
  queryIndex: string;
  queryJson: string;
  displayJsonQuery: string;
  pageState: string;
  isLoading: boolean;
  error: any;
  modalState: string;
  username: string;
  currentTags: string[];
  accessibleTags: string[];
}
export class BulkAddInspectorComponent extends Component<InspectorViewProps, RequestSelectorState> {
  // props.adapters is the object of all adapters and may vary depending
  // on who and where this inspector was opened. You should check for all
  // adapters you need, in the below shouldShow method, before accessing
  // them here.
  static propTypes = {
    adapters: PropTypes.object.isRequired,
    title: PropTypes.string.isRequired,
  };

  constructor(props: InspectorViewProps) {
    super(props);

    props.adapters.requests!.on('change', this._onRequestsChange);

    const requests = props.adapters.requests!.getRequests();
    this.state = {
      requests,
      request: requests.length ? requests[0] : null,
      queryIndex: '',
      queryJson: '',
      displayJsonQuery: '',
      pageState: '',
      isLoading: true,
      error: '',
      modalState: '',
      username: '',
      currentTags: [],
      accessibleTags: [],
    };
  }

  async componentWillMount() {
    await this.getUser();
    await this.getTags();
    await this.getQueryParamenters();

    this.setState({ isLoading: false });
  }

  getUser = async () => {
    const core = getCore();

    await core.http
      .get('/api/spitting_alpaca/getuser')
      .then((res: any) => {
        this.setState({ username: res.username });
      })
      .catch((err) => console.log('getusername failed:' + err));
  };

  delay = (time: number) => {
    return new Promise((resolve) => setTimeout(resolve, time));
  };

  setModalStateError = (err: any) => {
    this.setState({ pageState: 'Error' });
    this.setState({ error: err });
    this.setState({ isLoading: false });
  };

  setModalStateGetCountPage = (QJ: string, DQJ: string, QI: string) => {
    this.setState({ pageState: 'SubmitCount' });
    this.setState({ queryJson: QJ, displayJsonQuery: DQJ, queryIndex: QI });
    this.setState({ isLoading: false });
  };
  setQueryParameters = () => {};

  /*Get the queryJson and the QueryIndex so the bulk api can be populated */
  getQueryParamenters = async () => {
    let tempQueryJson: string;
    let tempQueryIndex: string;
    let tempDisplayJsonQuery: string;

    try {
      tempQueryJson = JSON.stringify(this.state.request?.json?.query);
      tempDisplayJsonQuery = JSON.stringify(this.state.request?.json?.query, null, 2);
      tempQueryIndex = JSON.stringify(this.state.request?.stats?.indexPattern.value);
    } catch (err) {
      if (err != undefined) {
        this.setModalStateError(err);
      } else {
        this.setModalStateError('');
      }
      return;
    }

    this.setModalStateGetCountPage(tempQueryJson, tempDisplayJsonQuery, tempQueryIndex);
  };

  _onRequestsChange = () => {
    const requests = this.props.adapters.requests!.getRequests();
    const newState = { requests } as RequestSelectorState;

    if (!this.state.request || !requests.includes(this.state.request)) {
      newState.request = requests.length ? requests[0] : null;
    }
    this.setState(newState);
  };

  selectRequest = (request: Request) => {
    if (request !== this.state.request) {
      this.setState({ request });
    }
  };

  //Get user specific data tags API call
  getTags = async () => {
    this.setState({ isLoading: true });
    const core = getCore();

    await core.http
      .post('/api/spitting_alpaca/getalltags')
      .then(async (res: any) => {
        console.log(res);
        //Check for empty items
        if (res.response.length < 1) {
          // setResponseData(res.response);
          this.setState({ isLoading: false });

          //Otherwise, handle the response
        } else {
          let tempTags: string[] = [];
          let tempMappings: DataTag[] = [];
          let tempAccessibleTags: string[] = [];

          let count = 0;
          res.response?.forEach((dataTag: DataTagHit) => {
            tempMappings.push({
              id: count,
              tag: dataTag._source.tag,
              details: dataTag._source.details,
              owner: dataTag._source.owner,
              users: dataTag._source.users,
              timestamp: dataTag._source.timestamp,
              _id: dataTag._id,
            });
            count = count + 1;

            //Push all found tags to currentTags
            tempTags.push(dataTag._source.tag);
            if (
              dataTag._source.owner == this.state.username ||
              dataTag._source.users.includes(this.state.username)
            ) {
              //if the data tag contains the username in either field the users has access to the data tag and can add or delete the tag in bulk query
              tempAccessibleTags.push(dataTag._source.tag);
            }
          });

          this.setState({ accessibleTags: tempAccessibleTags });
          this.setState({ currentTags: tempTags });
          this.setState({ isLoading: false });
        }
      })
      .catch((err) => console.log(err));

    return;
  };

  componentWillUnmount() {
    this.props.adapters.requests!.removeListener('change', this._onRequestsChange);
  }

  refreshErrorScreen = async () => {
    this.setState({ isLoading: true });
    await this.delay(1000);
    await this.getQueryParamenters();
    this.setState({ isLoading: false });
  };

  createTagOnClick = () => {
    this.setState({ modalState: 'Create' });
  };

  addTagOnClick = () => {
    this.setState({ modalState: 'AddTag' });
  };

  deleteTagOnClick = () => {
    this.setState({ modalState: 'DeleteTag' });
  };

  closeModal = () => {
    this.setState({ modalState: 'None' });
  };

  pushTagToCurrentTags = () => {};

  convertTagsToComboBoxOptions = () => {
    let tempComboBoxOptions: EuiComboBoxOptionOption<any>[] = [];

    this.state.accessibleTags.forEach((tag) => {
      tempComboBoxOptions.push({ label: tag });
    });

    return tempComboBoxOptions;
  };

  render() {
    let page;
    let errorMessage = this.state.error.length > 0 ? '' : '\n Error: ' + this.state.error;
    let modal;

    let loading = (
      <div>
        <EuiEmptyPrompt
          icon={<EuiLoadingLogo logo="logoKibana" size="xl" />}
          title={<h2>Loading Info</h2>}
        />
      </div>
    );

    switch (this.state.modalState) {
      case 'Create':
        modal = (
          <CreateDataTag
            pushTagToCurrentTags={this.pushTagToCurrentTags}
            closeModal={this.closeModal}
            getTags={this.getTags}
            username={this.state.username}
            currentTags={this.state.currentTags}
          />
        );
        break;

      case 'AddTag':
        modal = (
          <BulkAddModal
            closeModal={this.closeModal}
            addOptions={this.convertTagsToComboBoxOptions()}
            queryJson={this.state.queryJson}
            queryIndex={this.state.queryIndex}
          />
        );
        break;
      case 'DeleteTag':
        modal = (
          <BulkDeleteModal
            closeModal={this.closeModal}
            addOptions={this.convertTagsToComboBoxOptions()}
            queryJson={this.state.queryJson}
            queryIndex={this.state.queryIndex}
          />
        );
        break;
      case 'None':
        modal = <div></div>; //empty modal so it doesnt display
        break;
    }

    switch (this.state.pageState) {
      case 'Error':
        page = (
          <div>
            <EuiButton onClick={this.refreshErrorScreen}>Refresh</EuiButton>
            <EuiSpacer size={'m'} />
            <EuiEmptyPrompt
              iconType="cross"
              color="danger"
              title={<h2>Error with query</h2>}
              body={<p>There was an error loading the query parameters. {errorMessage}</p>}
            />
          </div>
        );
        break;
      case 'SubmitCount':
        let index = JSON.stringify({ index: [this.state.queryIndex] });

        page = (
          <div>
            <EuiFlexGroup>
              <EuiFlexItem grow={false}>
                <EuiTitle size="m">
                  <h1>Bulk Add Tag</h1>
                </EuiTitle>
              </EuiFlexItem>
            </EuiFlexGroup>

            <EuiSpacer size={'s'} />

            <hr />

            {/* <EuiSpacer size={'s'} />
            <div>
              <EuiAccordion id={'EuiUserAccordion'} buttonContent={'Query Parameters'}>
                <EuiCodeBlock language="json" fontSize="s" isCopyable lineNumbers>
                  {index}
                  {this.state.displayJsonQuery}
                </EuiCodeBlock>
              </EuiAccordion>
            </div> */}
            <EuiSpacer size={'s'} />

            <EuiFlexGroup gutterSize="l">
              <EuiFlexItem>
                <EuiCard
                  icon={<EuiIcon size="xxl" type={'tag'} color="success" />}
                  title={'Create Tag'}
                  hasBorder
                  description="Create a new data tag that can later be added to other documents."
                  onClick={this.createTagOnClick}
                />
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiCard
                  icon={<EuiIcon size="xxl" type={'plus'} color="primary" />}
                  title={'Bulk Add Tag'}
                  hasBorder
                  description="Add an existing data tag to all documents returned by the current query."
                  onClick={this.addTagOnClick}
                />
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiCard
                  icon={<EuiIcon size="xxl" type={'trash'} color="danger" />}
                  title={'Delete Tag'}
                  hasBorder
                  description="Delete tags will remove all selected tags from the documents returned by the current query."
                  onClick={this.deleteTagOnClick}
                />
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiSpacer size={'s'} />
            <EuiAccordion
              id={'simpleAccordionId'}
              buttonContent="Current Query"
              initialIsOpen={true}
            >
              <EuiPanel color="subdued">
                <EuiCodeBlock language="json" fontSize="m" paddingSize="m">
                  {index}
                  {this.state.displayJsonQuery}
                </EuiCodeBlock>
              </EuiPanel>
            </EuiAccordion>
          </div>
        );
        break;

      default:
        page = loading;
        break;
    }
    return (
      <div>
        {this.state.isLoading ? loading : page}
        {modal}
      </div>
    );
  }
}
