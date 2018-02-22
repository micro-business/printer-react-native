// @flow

import { call, put, takeEvery } from 'redux-saga/effects';
import net from 'react-native-tcp';
import ActionTypes from './ActionTypes';
import * as Actions from './Actions';

const connectAndSendDocumentToPrinter = (hostname, port, documentContent) =>
  new Promise((resolve, reject) => {
    const socket = net.createConnection(port, hostname, () => {
      const resetCommand = String.fromCharCode(0x1b) + '@\r\n';
      const feedPaperAndCutCommand = String.fromCharCode(0x1d) + 'VA\r\n';

      if (socket.write(resetCommand + documentContent + feedPaperAndCutCommand)) {
        socket.destroy();
      }
    });

    socket.on('drain', () => {
      socket.destroy();
    });

    socket.on('close', () => {
      resolve();
    });

    socket.on('error', error => {
      reject(error);
    });
  });

function* printDocumentAsync(action) {
  try {
    yield put(Actions.printDocumentInProgress(action.payload));
    yield call(connectAndSendDocumentToPrinter, action.payload.get('hostname'), action.payload.get('port'), action.payload.get('documentContent'));
    yield put(Actions.printDocumentSucceeded(action.payload));
  } catch (exception) {
    yield put(Actions.printDocumentFailed(action.payload.set('errorMessage', exception.message)));
  }
}

export default function* watchPrintDocument() {
  yield takeEvery(ActionTypes.ESC_POS_PRINTER_PRINT_DOCUMENT, printDocumentAsync);
}
