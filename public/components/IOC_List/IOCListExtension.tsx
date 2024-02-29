import { RegisteredTopNavMenuData } from '../../../../../src/plugins/navigation/public/top_nav_menu/top_nav_menu_data';
import { FullSetup } from '../../types';

import { IOCListPanelManager } from './IOCListPanelManager';

export function GetIOCListExtension(setup: FullSetup): RegisteredTopNavMenuData {
  var discoverMgr = new IOCListPanelManager({});
  var discoverMenu = discoverMgr.start(setup);

  return {
    id: 'registered-discover-panel',
    label: 'IOC Lists',
    description: 'Registered Discover Demo',
    run: discoverMenu.toggleContextMenu,
    testId: 'demoDiscoverRegisteredNewButton',
    appName: 'discover',
  };
}
