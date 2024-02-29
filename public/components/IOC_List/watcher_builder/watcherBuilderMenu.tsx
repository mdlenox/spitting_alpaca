import React, { Fragment, useEffect, useState } from 'react';
import {
  EuiButton,
  EuiButtonGroup,
  EuiComboBox,
  EuiDescribedFormGroup,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyoutBody,
  EuiFlyoutHeader,
  EuiFormRow,
  EuiRange,
  EuiSpacer,
  EuiSwitch,
  EuiText,
  EuiTitle,
  useGeneratedHtmlId,
} from '@elastic/eui';

import ReactDOM from 'react-dom';
import { getCore, getDataViews } from '../../../services';
import { DataView } from 'src/plugins/data_views/common';
import { Metadata, WatcherTriggerContainer } from '@elastic/elasticsearch/lib/api/typesWithBodyKey';
import rison from 'rison-node';

import { isValid } from '../../../../common/helpers';

interface WBMProps {
  listName: string;
  closeWatcher: () => void;
  watcherCompletedClose: () => void;
  IOClist: {
    fieldName: string;
    fieldValue: string;
    rowCount: number;
    note: string;
    flag: string;
  }[];
  indexPattern?: DataView;
}

const WatcherBuildMenu = (Props: WBMProps) => {
  const core = getCore();
  const [scriptMaxSizeInBytes, setScriptMaxSizeInBytes] = useState<number>(65535);
  const [connectors, setConnectors] = useState<any>({});
  const [watchError, setWatcherError] = useState<string | null>(null);
  const [triggerInterval, setTriggerInterval] = useState<number>(1); //this may change i dont think i want a text field but rather an incremental component
  const [dataSize, setDataSize] = useState<number>(1);
  const [dataViews, setDataViews] = useState<{ label: string }[]>();
  const [selectedDataViews, setSelectedDataViews] = useState<{ label: string }[]>([]);
  const [webhookOptions, setWebhookOptions] = useState<{ label: string }[]>([]);
  const [selectedWebhook, setSelectedWebhook] = useState<{ label: string }[]>([]);
  const [watcherName, setWatcherName] = useState<string>(Props.listName);
  const [watcherNameIsInvalid, setWatcherNameIsInvalid] = useState<boolean>(false);
  const [dataViewIsInvalid, setDataViewIsInvalid] = useState<boolean>(false);
  const [webhookIsInvalid, setWebhookIsInvalid] = useState<boolean>(false);
  const [submitWatchIsLoading, setSubmitWatchIsLoading] = useState<boolean>(false);
  const [watcherURLOption, setWatcherURLOption] = useState<boolean>(false);
  const currentURL = window.location.href;

  const compressedToggleButtonGroupPrefix = useGeneratedHtmlId({
    prefix: 'compressedToggleButtonGroup',
  });

  const watcherId = useGeneratedHtmlId({
    prefix: watcherName.trim().replaceAll(' ', '-'),
  });

  const [toggleCompressedIdSelected, setToggleCompressedIdSelected] = useState(
    `${compressedToggleButtonGroupPrefix}__0`
  );

  const toggleButtonsCompressed = [
    {
      id: `${compressedToggleButtonGroupPrefix}__0`,
      label: 'Range',
    },
    {
      id: `${compressedToggleButtonGroupPrefix}__1`,
      label: 'All',
    },
  ];

  const triggerScheduleSelectId = useGeneratedHtmlId({
    prefix: 'triggerScheduleSelectId',
  });

  const dataSizeSelectId = useGeneratedHtmlId({
    prefix: 'triggerScheduleSelectId',
  });

  const dataViewsToBeFilteredOut: String[] = [
    'ioc-list*',
    'favorited-dashboards*',
    'ingest-logs*',
    'data-tags*',
    'dashboard-notes*',
    'user-workspace-configs*',
  ];

  useEffect(() => {
    const fetchClusterSettings = async () => {
      await core.http
        .get('/api/spitting_alpaca/getclustersettings')
        .then((data: any) => {
          //TODO Parse the script.max_size_in_bytes out of it and set the limit

          const scriptSetting = data.response.body.defaults.script;
          //check to see if the script max size in bytes property exist and if it doesnt set it to the default
          if (Object.prototype.hasOwnProperty.call(scriptSetting, 'max_size_in_bytes')) {
            setScriptMaxSizeInBytes(scriptSetting.max_size_in_bytes);
          } else {
            setScriptMaxSizeInBytes(65535);
          }
        })
        .catch((error) => {
          let message = 'Unknown Error';
          if (error instanceof Error) message = error.message;
          console.log({ message });
          setWatcherError(message);
        });
    };

    const fetchConnectors = async () => {
      await core.http
        .get('/api/actions/connectors')
        .then((connectors: any) => {
          if (Array.isArray(connectors)) {
            let tempConnectors: any[] = [];
            let tempWebhooksForDisplay: { label: string }[] = [];
            connectors.forEach((connector) => {
              if (connector.connector_type_id.includes('.webhook')) {
                tempConnectors.push(connector);
                tempWebhooksForDisplay.push({ label: connector.name });
              }
            });
            setConnectors(tempConnectors);
            setWebhookOptions(tempWebhooksForDisplay);
          } else {
            //throw an error since the array is either empty or not an array
          }
        })
        .catch((error) => {
          let message = 'Unknown Error';
          if (error instanceof Error) message = error.message;
          console.log({ message });
          setWatcherError(message);
        });
    };

    const fetchDataViews = async () => {
      let dataViewArray: { label: string }[] = [];
      try {
        let tempDataViews: string[] = await getDataViews().getTitles();
        tempDataViews.forEach((item) => {
          if (!dataViewsToBeFilteredOut.includes(item)) {
            dataViewArray.push({ label: item });
          }
        });
      } catch (error) {
        let message = 'Unknown Error';
        if (error instanceof Error) message = error.message;
        console.log({ message });

        setWatcherError(message);
      }
      setDataViews(dataViewArray);
    };

    const fetchAll = async () => {
      await fetchClusterSettings();
      await fetchConnectors();
      await fetchDataViews();
    };

    try {
      fetchAll();
    } catch (error) {
      let message: string = 'Unknown Error';
      if (error instanceof Error) message = error.message;
      console.log({ message });
      setWatcherError(message);
    }
  }, []);

  const copDSLFilter = (iocList: any) => {
    let gte = 'now-' + dataSize + 'd';
    let should: { match_phrase: { [x: number]: any } }[] = [];

    iocList.forEach((element: any) => {
      should.push({ match_phrase: { [element.fieldName]: element.fieldValue } });
    });

    let must = [{ range: { '@timestamp': { gte } } }];

    //check to see the position of the button group ie range or all. if the range is on  all we dont add the must boolean logic as removing it will query all data
    let bool = Number(toggleCompressedIdSelected[toggleCompressedIdSelected.length - 1])
      ? { should, minimum_should_match: 1 }
      : { should, minimum_should_match: 1, must };
    let query = {
      bool,
    };

    return query;
  };

  //This query is used just for the URL that gets sent in the actino. The reason for this is the action url cant have a range. Since we need to dynamically get the time of the executed watcher we remove it.
  const queryForURLEncoding = (iocList: any) => {
    let should: { match_phrase: { [x: number]: any } }[] = [];

    //since this query will be used in the url it will need all spaces in the selectors replaces with %20
    iocList.forEach((element: any) => {
      should.push({
        match_phrase: { [element.fieldName]: element.fieldValue.replaceAll(' ', '%20') },
      });
    });

    //check to see the position of the button group ie range or all. if the range is on  all we dont add the must boolean logic as removing it will query all data
    let bool = { should, minimum_should_match: 1 };
    let query = {
      bool,
    };

    return query;
  };

  // these should really be stored in a common
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

  const checkWatcherName = async (name: string) => {
    let watcherNameList: string[] = [];
    try {
      await core.http.get('/api/spitting_alpaca/getwatchers').then((res: any) => {
        res.response.body.watches.forEach((watcher: { watch: { metadata: { name: string } } }) => {
          watcherNameList.push(watcher.watch.metadata.name);
        });
      });
    } catch (error) {
      let message = 'Unknown Error';
      if (error instanceof Error) message = error.message;
      console.log({ message });
      setWatcherError(message);
    }

    if (watcherNameList.includes(name)) {
      return true;
    } else {
      return false;
    }
  };

  const checkDataViewAndConnectorSelection = async () => {
    //this function returns true if the selected are invalid and false if they are good. This is a little backwards but it makes the other function look a little neater
    let retValue = false;
    let parsedWatchName = watcherName.trim().replaceAll(/\s+/g, ' ');

    //checking selected webhook
    if (selectedWebhook.length == 0 || selectedWebhook == undefined || selectedWebhook == null) {
      //webhook selection is invalid and needs to be changed, set the right properties to invalid
      setWebhookIsInvalid(true);
      retValue = true;
    } else {
      setWebhookIsInvalid(false);
    }

    //checking for selected Data views
    if (
      selectedDataViews.length == 0 ||
      selectedDataViews == undefined ||
      selectedDataViews == null
    ) {
      setDataViewIsInvalid(true);
      retValue = true;
    } else {
      setDataViewIsInvalid(false);
    }

    //checking for watcher name length
    if (
      parsedWatchName.length == 0 ||
      parsedWatchName == undefined ||
      parsedWatchName == null ||
      !parsedWatchName.match(/^[a-zA-Z0-9\s\-_]+$/) ||
      parsedWatchName.length >= 32
    ) {
      toastMessageWarning('Watcher names cannot contain special characters except -_', 3000);
      setWatcherNameIsInvalid(true);
      retValue = true;
    } else {
      //checking for watcher name
      if (await checkWatcherName(parsedWatchName)) {
        setWatcherNameIsInvalid(true);
        toastMessageWarning("Watcher Name '" + parsedWatchName + "' already exists.", 5000);
        retValue = true;
      } else {
        setWatcherNameIsInvalid(false);
      }
    }

    return retValue;
  };

  const getIndexNames = () => {
    let dv: string[] = [];

    selectedDataViews.forEach((dataview) => {
      dv.push(dataview.label);
    });

    return dv.toString();
  };

  const onCreateWatcherButonClick = async () => {
    let parsedWatchName = watcherName.trim().replaceAll(/\s+/g, ' ');
    setWatcherName(parsedWatchName);

    setSubmitWatchIsLoading(true);

    //checks
    if (await checkDataViewAndConnectorSelection()) {
      setSubmitWatchIsLoading(false);
      return;
    }
    const currentConnector = connectors.find((object: { name: string }, i: string | number) => {
      if (object.name === selectedWebhook[0].label) {
        return { url: connectors[i].config.url };
      }
    });

    let [host, ...path] = currentConnector.config.url.split('//')[1].split('/');
    path = path.join('/');

    const query = copDSLFilter(Props.IOClist);
    const queryForURL = queryForURLEncoding(Props.IOClist);
    const dataViews = selectedDataViews.map((dv) => dv.label);

    const trigger: WatcherTriggerContainer = {
      schedule: {
        interval: triggerInterval + 'd',
      },
    };

    const input: any = {
      search: {
        request: {
          search_type: 'query_then_fetch',
          indices: dataViews,
          rest_total_hits_as_int: true,
          body: {
            query,
            sort: [
              {
                '@timestamp': {
                  order: 'asc',
                },
              },
            ],
          },
        },
      },
    };

    const condition = {
      compare: {
        'ctx.payload.hits.total': {
          gt: 1,
        },
      },
    };

    const actions = {
      label_message: {
        webhook: {
          scheme: 'https',
          host,
          port: 443,
          method: 'post',
          path,
          params: {},
          headers: {
            'Content-Type': 'application/json',
          },
          body: '',
        },
      },
    };

    const name = parsedWatchName;

    const metadata: Metadata = {
      name,
    };

    //create final object
    const watcherObject = { trigger, input, condition, actions, metadata };

    let parsedWatcherObject = JSON.stringify(watcherObject).replaceAll('\\"', '"');
    parsedWatcherObject = parsedWatcherObject.replaceAll('""""', '"""');
    let body = JSON.parse(parsedWatcherObject);

    //"https://moondragon-kibana.ccu.cloud:9243/app/discover#/?_a=h@f78a174"

    // prettier-ignore
    const actionURLNoQuery = currentURL.split('discover#')[0]+'discover#/?_g=(filters:!(),time:(from:\'{{ctx.payload.hits.hits.0._source.@timestamp}}\',to:\'{{ctx.execution_time}}\'))';
    const parsedQueryURL = rison.encode(queryForURL);
    const actionURL =
      currentURL.split('discover#')[0] +
      'discover#/?_g=(filters:!()' +
      ",time:(from:\\'{{ctx.payload.hits.hits.0._source.@timestamp}}\\',to:\\'{{ctx.execution_time}}\\'))&_a=(filters:!((query:" +
      parsedQueryURL +
      ')))';

    // prettier-ignore
    body.actions.label_message.webhook.body = watcherURLOption ? '{\"text\":\"*-------------Watcher \\\"'+ watcherName +'\\\" Total Hits {{ctx.payload.hits.total}}:-------------* \n    -Original IOC List: '+ Props.listName +' \n    -Dataview: '+ getIndexNames() +' \n    -Execution Time URL: <'+ actionURL +'|Discover Search > \n    -Execution Time: {{ctx.execution_time}} \n --------------------------------------------------------------------- \"}' : '{\"text\":\"*-------------Watcher \\\"'+ watcherName +'\\\" Total Hits {{ctx.payload.hits.total}}:-------------* \n    -Original IOC List: '+ Props.listName +' \n    -Dataview: '+ getIndexNames() +' \n    -Execution Time URL: <'+ actionURLNoQuery +'|Discover Search > \n    -Execution Time: {{ctx.execution_time}} \n \"}';

    const watcher = {
      id: watcherId,
      active: true,
      body: body,
    };

    //Check object size before API call
    const watcherSize: number = JSON.stringify(watcherObject).length;

    if (watcherSize >= scriptMaxSizeInBytes) {
      //toast the user and return out of the function so the api call isnt completed

      //if the watcherURLOption is true the query appended to the watcher could be causing it to be to large. So we create two different strings to notify the user so they can try to shorten the length of the watcher by excluding the query in the returned URL
      const toastMessage: string = watcherURLOption
        ? 'Creation Error: Watcher size of [' +
          watcherSize +
          '] ' +
          ', watcher size must be smaller then ' +
          scriptMaxSizeInBytes +
          '. Try excluding the query for a smaller watcher script.'
        : 'Creation Error: Watcher size of [' +
          watcherSize +
          '] ' +
          ', watcher size must be smaller then ' +
          scriptMaxSizeInBytes;

      toastMessageWarning(toastMessage, 5000);
      setSubmitWatchIsLoading(false);
      return;
    }

    try {
      await core.http
        .put('/api/spitting_alpaca/createioclistwatcher', {
          body: JSON.stringify({ watcher: watcher }),
        })
        .then((res: any) => {
          console.log(res);
          if (res.response.statusCode >= 200 || res.response.statusCode <= 299) {
            //toast that the watcher was created successfuly
            toastMessageSuccess('Watcher:' + parsedWatchName + ' created successfuly');
            Props.watcherCompletedClose();
          }
        });
    } catch (error) {
      let message = 'Unknown Error';
      if (error instanceof Error) message = error.message;
      console.log({ message });
      setWatcherError(message);
      setSubmitWatchIsLoading(false);
    }
    setSubmitWatchIsLoading(false);
  };

  const onTriggerSliderValueChange = (
    e: React.ChangeEvent<HTMLInputElement> | React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    setTriggerInterval(e.target.value);
  };

  const onDataViewChange = (selectedOptions: { label: string }[]) => {
    setSelectedDataViews(selectedOptions);
  };

  const onWebhookChange = (selectedWebhook: { label: string }[]) => {
    setSelectedWebhook(selectedWebhook);
  };

  const onDataSizeSliderValueChange = (e) => {
    setDataSize(e.target.value);
  };

  const onWatcherNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWatcherName(e.target.value);
  };

  const onChangeCompressed = (optionId: React.SetStateAction<string>) => {
    setToggleCompressedIdSelected(optionId);
  };

  const onSwitchChange = (e) => {
    setWatcherURLOption(e.target.checked);
  };

  return (
    <div>
      <EuiFlyoutHeader>
        <EuiTitle size="m">
          <h2> Create Watcher </h2>
        </EuiTitle>
      </EuiFlyoutHeader>
      <EuiFlyoutBody>
        <div className="eui-yScroll">
          {/* Watcher Name*/}

          <EuiDescribedFormGroup
            title={<h3>Watcher Name</h3>}
            description={<p>Enter the name of the watcher. </p>}
          >
            <EuiFormRow label="Name">
              <EuiFieldText
                placeholder="Placeholder text"
                value={watcherName}
                onChange={(e) => onWatcherNameChange(e)}
                isInvalid={watcherNameIsInvalid}
                aria-label="Use aria labels when no actual label is in use"
              />
            </EuiFormRow>
          </EuiDescribedFormGroup>

          {/* Trigger schedule group */}

          <EuiDescribedFormGroup
            title={<h3>Trigger Schedule</h3>}
            description={<p>Defines the interval for how often the watcher will execute. </p>}
          >
            <EuiFormRow label="Interval">
              <EuiRange
                id={triggerScheduleSelectId}
                showInput="inputWithPopover"
                min={1}
                max={30}
                value={triggerInterval}
                onChange={(e) => onTriggerSliderValueChange(e)}
                compressed
                append="day/s"
              />
            </EuiFormRow>
          </EuiDescribedFormGroup>

          {/* Input selection group */}

          <EuiDescribedFormGroup
            title={<h3>Input Selection</h3>}
            description={<p>Select what data view your watcher will query against. </p>}
          >
            <EuiFormRow label="Data Views" className="eui-yScroll" style={{ maxHeight: 250 }}>
              <EuiComboBox
                aria-label="Accessible screen reader label"
                placeholder="Select data view"
                options={dataViews}
                selectedOptions={selectedDataViews}
                onChange={onDataViewChange}
                isInvalid={dataViewIsInvalid}
                fullWidth={true}
                singleSelection={true}
              />
            </EuiFormRow>
          </EuiDescribedFormGroup>
          <EuiTitle size="xxs">
            <h1>Time Period</h1>
          </EuiTitle>

          <EuiButtonGroup
            name="coarsness"
            legend="This is a basic group"
            options={toggleButtonsCompressed}
            idSelected={toggleCompressedIdSelected}
            onChange={(id) => onChangeCompressed(id)}
            buttonSize="compressed"
            isFullWidth
          />

          <EuiDescribedFormGroup
            title={<h3> </h3>}
            description={
              <p>
                Select the time period data is queried against. Starting with when the watcher
                fires. All with query all the data present in the selected data views.{' '}
              </p>
            }
          >
            <EuiFormRow label="Days of Data">
              <EuiRange
                id={dataSizeSelectId}
                showInput="inputWithPopover"
                min={1}
                max={90}
                value={dataSize}
                onChange={(e) => onDataSizeSliderValueChange(e)}
                compressed
                append="day/s"
                disabled={
                  Number(toggleCompressedIdSelected[toggleCompressedIdSelected.length - 1])
                    ? true
                    : false
                }
              />
            </EuiFormRow>
          </EuiDescribedFormGroup>

          <EuiDescribedFormGroup
            title={<h3>Connector</h3>}
            description={<p>Select a webhook the action will be sent through. </p>}
          >
            <EuiFormRow label="Webhook">
              <EuiComboBox
                aria-label="Accessible screen reader label"
                placeholder="Select a webhook"
                options={webhookOptions}
                selectedOptions={selectedWebhook}
                onChange={onWebhookChange}
                singleSelection={true}
                isInvalid={webhookIsInvalid}
              />
            </EuiFormRow>
          </EuiDescribedFormGroup>
          {/* 
          <EuiDescribedFormGroup
            title={<h3>URL Contents</h3>}
            description={
              <p>
                Append the query to the MM URL. Appending the query will add data to the watcher
                script and may increase the size beyond the set limit.{' '}
              </p>
            }
          >
            <EuiFormRow label="">
              <EuiSwitch
                label={watcherURLOption ? 'Query Appened' : 'Query Excluded'}
                checked={watcherURLOption}
                onChange={(e) => onSwitchChange(e)}
              />
            </EuiFormRow>
          </EuiDescribedFormGroup> */}

          <EuiSpacer size={'s'}></EuiSpacer>
        </div>
      </EuiFlyoutBody>

      <Fragment>
        <EuiFlexGroup justifyContent="center">
          <EuiFlexItem>
            <EuiButton isLoading={submitWatchIsLoading} onClick={onCreateWatcherButonClick}>
              Create Watcher
            </EuiButton>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiButton iconType="exit" onClick={Props.closeWatcher}>
              Back
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </Fragment>
    </div>
  );
};
export default WatcherBuildMenu;
