// @flow

import ActionTypes from './ActionTypes';
import initialState from './InitialState';
import Status from './Status';

export default (state = initialState, action) => {
  switch (action.type) {
  case ActionTypes.ESC_POS_PRINTER_ACKNOWLEDGE_FAILED_OPERATION:
    return state.deleteIn(['failedOperations', action.payload.get('operationId')]);

  case ActionTypes.ESC_POS_PRINTER_PRINT_DOCUMENT_SUCCEEDED:
    return state.setIn(['printDocumentOperationsStatus', action.payload.get('operationId')], Status.SUCCEEDED);

  case ActionTypes.ESC_POS_PRINTER_PRINT_DOCUMENT_FAILED:
    return state
      .setIn(['printDocumentOperationsStatus', action.payload.get('operationId')], Status.FAILED)
      .setIn(['failedOperations', action.payload.get('operationId')], action.payload);

  case ActionTypes.ESC_POS_PRINTER_PRINT_DOCUMENT_IN_PROGRESS:
    return state.setIn(['printDocumentOperationsStatus', action.payload.get('operationId')], Status.IN_PROGRESS);

  case ActionTypes.ESC_POS_PRINTER_ACKNOWLEDGE_PRINT_DOCUMENT_OPERATION:
    return state.deleteIn(['printDocumentOperationsStatus', action.payload.get('operationId')]);

  default:
    return state;
  }
};
