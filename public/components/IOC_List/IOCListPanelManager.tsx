import ReactDOM from 'react-dom';
import { FullSetup } from '../../types';
import React, { Component } from 'react';
import { EuiFlyout, EuiFlyoutBody, EuiFlyoutHeader, EuiTitle } from '@elastic/eui';
import { getDiscoverUpdate } from '../../services';
import IOCSearchListsComponent from './IOCSearchListsComponent';

interface DPMState {
  iocList: undefined;
  isLoadingData: boolean;
}

interface DPMProps {}

export class IOCListPanelManager extends Component<DPMProps, DPMState> {
  constructor(props: DPMProps) {
    super(props);

    this.state = {
      iocList: undefined,
      isLoadingData: true,
    };
  }
  private container = document.createElement('div');

  wrapperRef = React.createRef<HTMLDivElement>();

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

  handleClickOutside = (event: any) => {
    if (this.wrapperRef && !this?.wrapperRef?.current?.contains(event.target)) {
      this.onClose();
    }
  };

  private onClose = () => {
    document.removeEventListener('mousedown', this.handleClickOutside);
    ReactDOM.unmountComponentAtNode(this.container);
  };

  private toggleContextMenu({
    setup,
    anchorElement,
  }: {
    setup: FullSetup;
    anchorElement: HTMLElement;
  }) {
    if (document.getElementById('Discover_Flyout')) {
      const update = getDiscoverUpdate();
      update();
      return;
    }

    document.body.appendChild(this.container);

    const element = (
      <div>
        {/* <I18nProvider>
          {this.style} */}

        <EuiFlyout ref={this.wrapperRef} id="Notes_Flyout" onClose={this.onClose} size="s">
          <EuiFlyoutHeader>
            <EuiFlyoutHeader>
              <EuiTitle size="m">
                <h2>IOC Lists</h2>
              </EuiTitle>
            </EuiFlyoutHeader>
          </EuiFlyoutHeader>
          <hr />
          <EuiFlyoutBody>
            <IOCSearchListsComponent />
          </EuiFlyoutBody>
        </EuiFlyout>
        {/* </I18nProvider> */}
      </div>
    );
    ReactDOM.render(element, this.container);
  }
}
