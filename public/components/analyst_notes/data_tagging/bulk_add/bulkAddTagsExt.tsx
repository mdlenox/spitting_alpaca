import { RegisteredTopNavMenuData } from '../../../../../../../src/plugins/navigation/public/top_nav_menu/top_nav_menu_data';
import { FullSetup } from '../../../../types';
import { BulkAddMenuManager } from './bulkAddMenuManager';

export function GetBulkAddTagsExtension(setup: FullSetup): RegisteredTopNavMenuData {
  var notesmgr = new BulkAddMenuManager();
  var notesmenu = notesmgr.start(setup);
  return {
    id: 'registered-bulk-add',
    label: 'Bulk Add Tag',
    description: 'Registered Dashboard Demo',
    run: notesmenu.toggleContextMenu,
    testId: 'demoDashboardRegisteredNewButton',
    appName: 'dashboard',
  };
}
