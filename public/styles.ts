import * as CSS from 'csstype';
import styled from 'styled-components';
import strike from './assests/images/strikethru.svg';

import { getCore } from './services';

interface Style extends CSS.Properties, CSS.PropertiesHyphen {}
const core = getCore();

const lineColor = core.uiSettings.get('theme:darkMode') ? '#131317' : '#D3DAE6';

export const tablestyle: Style = {
  border: 0,
  padding: '0px',
  margin: '0 auto',
  width: '1200px',
  height: '400px',
};

export const constyle: Style = {
  float: 'left',
  width: '33%',
  height: '100%',
  overflow: 'auto',
};

export const istyle: Style = {
  width: '109%',
  height: '100%',
  overflow: 'auto',
};

export const DLIctrlstyle: Style = {
  height: '40px',
  float: 'right',
};

export const dashModalStyle: Style = {
  top: '5vh',
  height: '90vh',
  width: '90vw',
  overflow: 'auto',
};

export const dailyfeedtemplatestyle: Style = {
  minHeight: '30vh',
  width: '90vw',
  //backgroundImage: `url(${demoFeed})`,
  //backgroundSize:"contain",
  //backgroundRepeat: "no-repeat",
  border: '.125em solid ' + lineColor,
  borderRadius: '.25em',
};

export const searchtemplatestyle: Style = {
  height: '10vw',
  width: '100%',
  //backgroundImage: `url(${strike})`,
  marginTop: '.5em',
  border: '.25em solid ' + lineColor,
  borderRadius: '.5em',
};

export const notestemplatestyle: Style = {
  height: '70vw',
  width: '20%',
  backgroundImage: `url(${strike})`,
  border: '.25em solid ' + lineColor,
  borderRadius: '.5em',
  float: 'right',
};

export const dashboardtemplatestyle: Style = {
  minHeight: '70vw',
  width: '100%',
  border: '.125em solid ' + lineColor,
  borderRadius: '.25em',
  left: '0px',
};

export const Newstyle = styled.div`
  padding: 1rem;

  table {
    border-spacing: 0;
    border: 1px solid black;

    tr {
      :last-child {
        td {
          border-bottom: 0;
        }
      }
    }

    th,
    td {
      margin: 0;
      padding: 0.5rem;
      border-bottom: 1px solid black;
      border-right: 1px solid black;

      :last-child {
        border-right: 0;
      }
    }
  }
`;

export const BulkTableStyle = styled.div`
  padding: 1rem;
  ${
    '' /* These styles are suggested for the table fill all available space in its containing element */
  }
  display: block;
  ${'' /* These styles are required for a horizontaly scrollable table overflow */}
  overflow: auto;

  .table {
    border-spacing: 0;
    border: 1px solid black;

    .thead {
      ${'' /* These styles are required for a scrollable body to align with the header properly */}
      overflow-y: auto;
      overflow-x: hidden;
    }

    .tbody {
      ${'' /* These styles are required for a scrollable table body */}
      overflow-y: scroll;
      overflow-x: hidden;
      height: 250px;
    }

    .tr {
      :last-child {
        .td {
          border-bottom: 0;
        }
      }
      border-bottom: 1px solid black;
    }

    .th,
    .td {
      margin: 0;
      padding: 0.5rem;
      border-right: 1px solid black;

      ${
        '' /* In this example we use an absolutely position resizer,
       so this is required. */
      }
      position: relative;

      :last-child {
        border-right: 0;
      }

      .resizer {
        right: 0;
        background: blue;
        width: 10px;
        height: 100%;
        position: absolute;
        top: 0;
        z-index: 1;
        ${'' /* prevents from scrolling while dragging on touch devices */}
        touch-action :none;

        &.isResizing {
          background: red;
        }
      }
    }
  }
`;
