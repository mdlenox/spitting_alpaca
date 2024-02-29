import { Adapters } from '@kbn/inspector-plugin/common';
import { BulkAddInspectorComponent } from './bulkAddInspectorComponent';

export const BulkAddInspectorView = {
  // Title shown to select this view
  title: 'Bulk Add Tag',
  // An icon id from the EUI icon list
  icon: 'iconName',
  // An order to sort the views (lower means first)
  order: 100,
  // An additional helptext, that wil
  help: ``,
  shouldShow(adapters: Adapters) {
    // Only show if `someAdapter` is available. Make sure to check for
    // all adapters that you want to access in your view later on and
    // any additional condition you want to be true to be shown.

    return Boolean(adapters.requests);
  },
  // A React component, that will be used for rendering
  component: BulkAddInspectorComponent,
};
