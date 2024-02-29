import { SavedDashboardPanel } from 'src/plugins/dashboard/common/content_management/index';
import { DashboardPanelState } from 'src/plugins/dashboard/common/index';

export function convertSavedDashboardPanelToPanelState(
  savedDashboardPanel: SavedDashboardPanel
): DashboardPanelState {
  var type: string;
  if (savedDashboardPanel.type) {
    type = savedDashboardPanel.type;
  } else {
    type = 'visualization';
  }

  return {
    type: type,
    gridData: savedDashboardPanel.gridData,
    explicitInput: {
      id: savedDashboardPanel.panelIndex,
      ...(savedDashboardPanel.id !== undefined && { savedObjectId: savedDashboardPanel.id }),
      ...(savedDashboardPanel.title !== undefined && { title: savedDashboardPanel.title }),
      ...savedDashboardPanel.embeddableConfig,
    },
  };
}
