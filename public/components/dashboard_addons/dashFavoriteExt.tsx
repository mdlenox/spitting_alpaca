import { RegisteredTopNavMenuData } from '../../../../../src/plugins/navigation/public/top_nav_menu/top_nav_menu_data';
import { FullSetup } from '../../types';
import { FavoriteMenuManager } from '../favoriting/dashFavoriteMenuManager';


export function GetFavoriteExtension(setup:FullSetup):RegisteredTopNavMenuData{
    
  var favoritemgr = new FavoriteMenuManager;
  var favoritemenu = favoritemgr.start(setup);
  return {
      id: 'registered-dash-prop',
      label: 'Add to My Workspace',
      description: 'Registered Dashboard Demo',
      run: favoritemenu.toggleContextMenu,
      testId: 'demoDashboardRegisteredNewButton',
      appName: 'dashboard',
    };

};

