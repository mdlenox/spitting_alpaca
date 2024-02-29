import { EuiCheckboxGroupIdToSelectedMap } from '@elastic/eui/src/components/form/checkbox/checkbox_group';
import {
  EuiButton,
  EuiCheckboxGroup,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiWrappingPopover,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { ReactElement, useState } from 'react';
import { I18nProvider } from '@kbn/i18n-react';
import React from 'react';
import ReactDOM from 'react-dom';
import { FullSetup } from '../../types';
import { DashboardParams, FavoritedDash } from '../../../common/types';
import { getStateFromKbnUrl } from '../../../../../src/plugins/kibana_utils/public';
import { getCore, getCurrentUser } from '../../services';
import { TimeRange } from '@kbn/es-query';

enum UrlParams {
  SHOW_TOP_MENU = 'show-top-menu',
  SHOW_QUERY_INPUT = 'show-query-input',
  SHOW_TIME_FILTER = 'show-time-filter',
  SHOW_FILTER_BAR = 'show-filter-bar',
  HIDE_FILTER_BAR = 'hide-filter-bar',
}

interface UrlParamsSelectedMap {
  [UrlParams.SHOW_QUERY_INPUT]: boolean;
  [UrlParams.SHOW_TIME_FILTER]: boolean;
  [UrlParams.SHOW_FILTER_BAR]: boolean;
}

export class FavoriteMenuManager {
  private isOpen = false;
  private container = document.createElement('div');

  start(setup: FullSetup) {
    return {
      /**
       * Collects share menu items from registered providers and mounts the share context menu under
       * the given `anchorElement`. If the context menu is already opened, a call to this method closes it.
       * @param options
       */
      toggleContextMenu: (anchorElement: HTMLElement) => {
        this.toggleContextMenu({
          setup: setup,
          anchorElement: anchorElement,
        });
      },
    };
  }

  private onClose = () => {
    ReactDOM.unmountComponentAtNode(this.container);
    this.isOpen = false;
  };

  private toggleContextMenu({
    setup,
    anchorElement,
  }: {
    setup: FullSetup;
    anchorElement: HTMLElement;
  }) {
    if (this.isOpen) {
      this.onClose();
      return;
    }

    const AddForm = ({ setup }: { setup: FullSetup }): ReactElement => {
      console.log('TEST');
      var refresh = {
        value: 0,
        pause: true,
      };

      var g: any = getStateFromKbnUrl('_g') as any;
      //var a:A = getStateFromKbnUrl('_a') as A //no longer in kibana URL from 7.12 and above.
      var dashparams: DashboardParams = {
        //filters: a.filters,
        refreshInterval: refresh,
        time: g.time,
        //query:a.query
      };
      const [urlParamsSelectedMap, setUrlParamsSelectedMap] = useState<UrlParamsSelectedMap>({
        [UrlParams.SHOW_QUERY_INPUT]: true,
        [UrlParams.SHOW_TIME_FILTER]: true,
        [UrlParams.SHOW_FILTER_BAR]: false,
      });

      const checkboxes = [
        /*{
          id: UrlParams.SHOW_QUERY_INPUT,
          label: i18n.translate('dashboard.embedUrlParamExtension.query', {
            defaultMessage: 'Query',
          }),
        },
        */
        {
          id: UrlParams.SHOW_TIME_FILTER,
          label: i18n.translate('dashboard.embedUrlParamExtension.timeFilter', {
            defaultMessage: 'Time filter',
          }),
        },
        /*
        {
          id: UrlParams.SHOW_FILTER_BAR,
          label: i18n.translate('dashboard.embedUrlParamExtension.filterBar', {
            defaultMessage: 'Filter bar',
          }),
        },
        */
      ];

      const handleChange = (param: string): void => {
        const urlParamsSelectedMapUpdate = {
          ...urlParamsSelectedMap,
          [param]: !urlParamsSelectedMap[param as keyof UrlParamsSelectedMap],
        };
        setUrlParamsSelectedMap(urlParamsSelectedMapUpdate);
      };

      function getDashid(): string {
        var fullurl = window.location.href;
        var dashid = fullurl.split('?')[0].split('#')[1].split('/')[2];
        console.log('GET DASH ID');
        console.log(dashid);
        return dashid;
      }

      const OnSubmit = async (setup: FullSetup) => {
        console.log('get user');
        const currentUser = getCurrentUser();

        var core = getCore();
        const dash: FavoritedDash = {
          user: currentUser.username,
          dashid: getDashid(),
          showquery: urlParamsSelectedMap['show-query-input'],
          showtime: urlParamsSelectedMap['show-time-filter'],
          showfilter: urlParamsSelectedMap['show-filter-bar'],
          refreshInterval: dashparams.refreshInterval,
          filters: urlParamsSelectedMap['show-filter-bar'] ? dashparams.filters : undefined,
          time: urlParamsSelectedMap['show-time-filter'] ? dashparams.time : undefined,
          query: urlParamsSelectedMap['show-query-input'] ? dashparams.query : undefined,
        };
        //console.log("Checking time boolean: " + dash.showtime)
        if (!dash.showtime) {
          var defaultTime: TimeRange = { from: 'now-15m', to: 'now' };
          //console.log("Default time is: " + defaultTime.from + defaultTime.to)
          dash.time = defaultTime;
          //console.log("Time changed to: " + dash.time.from + dash.time.to)
        } else {
          //console.log("Nondefault time is: " + dash.time.from + dash.time.to)
        }
        console.log('test1');
        var container = this;
        setup.core.http
          .put('/api/spitting_alpaca/addfavorite', { body: JSON.stringify(dash) })
          .then((res) => {
            console.log('test2');
            core.notifications.toasts.addSuccess('Dashboard has been added to your Workspace', {
              toastLifeTimeMs: 3000,
            });
            container.onClose();
          })
          .catch((err) => {
            console.log('test3');
            console.log(err);
            core.notifications.toasts.addSuccess('Failed to add Dashboard to your Workspace', {
              toastLifeTimeMs: 3000,
            });
          });
      };

      return (
        <EuiFlexGroup gutterSize="s" alignItems="center">
          <EuiFlexItem>
            <EuiCheckboxGroup
              options={checkboxes}
              idToSelectedMap={urlParamsSelectedMap as unknown as EuiCheckboxGroupIdToSelectedMap}
              onChange={handleChange}
              legend={{
                children: i18n.translate('dashboard.embedUrlParamExtension.include', {
                  defaultMessage:
                    'Config to Include: Time filter must be updated before being submitted',
                }),
              }}
              data-test-subj="embedUrlParamExtension"
            />
          </EuiFlexItem>
          <EuiSpacer size="s" />
          <EuiFlexItem>
            <EuiButton
              size="s"
              fill
              onClick={() => {
                OnSubmit(setup);
              }}
            >
              Submit
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      );
    };

    this.isOpen = true;

    document.body.appendChild(this.container);
    const element = (
      <I18nProvider>
        <EuiWrappingPopover
          id="favoritePopover"
          button={anchorElement}
          isOpen={true}
          closePopover={this.onClose}
          panelPaddingSize="s"
          anchorPosition="downLeft"
        >
          <AddForm setup={setup} />
        </EuiWrappingPopover>
      </I18nProvider>
    );

    ReactDOM.render(element, this.container);
  }
}
