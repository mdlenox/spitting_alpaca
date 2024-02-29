import { DashboardContainerFactory } from 'src/plugins/dashboard/public/dashboard_container/embeddable/dashboard_container_factory';
import { DashboardContainerInput } from 'src/plugins/dashboard/common';
import * as React from 'react';
import { EmbeddableRenderer } from '../../../../../../src/plugins/embeddable/public';

interface Props {
  input: DashboardContainerInput;
  onInputUpdated?: (newInput: DashboardContainerInput) => void;
  // TODO: add other props as needed
}

export const createDashboardContainerByValueRenderer =
  ({ factory }: { factory: DashboardContainerFactory }): React.FC<Props> =>
  (props: Props) =>
    (
      <EmbeddableRenderer
        input={props.input}
        onInputUpdated={props.onInputUpdated}
        factory={factory}
      />
    );
