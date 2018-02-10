// @flow

import uuid from 'uuid/v4';
import ActionTypes from './ActionTypes';

export function acknowledgeFailedOperation(payload) {
  return {
    type: ActionTypes.ESC_POS_PRINTER_ACKNOWLEDGE_FAILED_OPERATION,
    payload,
  };
}

export function printDocument(payload) {
  return {
    type: ActionTypes.ESC_POS_PRINTER_PRINT_DOCUMENT,
    payload: payload.set('operationId', uuid()),
  };
}

export function printDocumentSucceeded(payload) {
  return {
    type: ActionTypes.ESC_POS_PRINTER_PRINT_DOCUMENT_SUCCEEDED,
    payload,
  };
}

export function printDocumentFailed(payload) {
  return {
    type: ActionTypes.ESC_POS_PRINTER_PRINT_DOCUMENT_FAILED,
    payload,
  };
}

export function printDocumentInProgress(payload) {
  return {
    type: ActionTypes.ESC_POS_PRINTER_PRINT_DOCUMENT_IN_PROGRESS,
    payload,
  };
}

export function acknowledgePrintDocumentStatus(payload) {
  return {
    type: ActionTypes.ESC_POS_PRINTER_ACKNOWLEDGE_PRINT_DOCUMENT_OPERATION,
    payload,
  };
}
