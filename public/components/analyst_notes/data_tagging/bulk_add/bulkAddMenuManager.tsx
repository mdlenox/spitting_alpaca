import ReactDOM from 'react-dom';
import { FullSetup } from '../../../../types';
import React from 'react';
import { I18nProvider } from '@kbn/i18n-react';
import { EuiFlyout, EuiFlyoutBody, EuiFlyoutHeader, EuiHeader, EuiTitle } from '@elastic/eui';
import { getNotesUpdate } from 'plugins/spitting_alpaca/public/services';

export class BulkAddMenuManager {
  private container = document.createElement('div');
  private style = (
    <style>
      {`
        body {
          transition: padding-right .9s;
          padding-right: 26%;
        }
        #Notes_Flyout {
          animation-duration: 1s;
        }
        `}
    </style>
  );
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
    if (document.getElementById('Notes_Flyout')) {
      const update = getNotesUpdate();
      update();
      return;
    }

    // document.addEventListener('mousedown', this.handleClickOutside);
    console.log('Added event listener1111');

    document.body.appendChild(this.container);

    const element = (
      <div>
        <I18nProvider>
          {this.style}

          <EuiFlyout ref={this.wrapperRef} id="Notes_Flyout" onClose={this.onClose} size="s">
            <EuiFlyoutHeader>
              <EuiHeader>
                <EuiTitle size="m">
                  <h1>Analyst Notes</h1>
                </EuiTitle>
              </EuiHeader>
            </EuiFlyoutHeader>
            <EuiFlyoutBody></EuiFlyoutBody>
          </EuiFlyout>
        </I18nProvider>
      </div>
    );
    ReactDOM.render(element, this.container);
  }
}
