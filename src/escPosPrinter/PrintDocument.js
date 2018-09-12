// @flow

import BluebirdPromise from 'bluebird';
import { call, put, takeEvery } from 'redux-saga/effects';
import net from 'react-native-tcp';
import iconv from 'iconv-lite';
import ActionTypes from './ActionTypes';
import * as Actions from './Actions';

const connectAndSendDocumentToPrinter = (hostname, port, buffer) =>
  new Promise((resolve, reject) => {
    const socket = net.createConnection(port, hostname, () => {
      if (socket.write(buffer)) {
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

const print = async documents =>
  BluebirdPromise.each(documents.toArray(), document => {
    const hostname = document.get('hostname');
    const port = document.get('port');
    const content = document.get('content');

    var finalContent = content;
    var indexOfCommandCode = finalContent.indexOf('##');

    while (indexOfCommandCode !== -1) {
      const part1 = finalContent.substring(0, indexOfCommandCode);
      const part2 = finalContent.substring(indexOfCommandCode + 4);
      const commandCode = finalContent.substring(indexOfCommandCode + 2, indexOfCommandCode + 4);

      finalContent = part1 + String.fromCharCode(parseInt('0x' + commandCode)) + part2;

      indexOfCommandCode = finalContent.indexOf('##');
    }

    const resetCommandBuffer = Buffer.from('\x1B@\x00');
    const documentContentBuffer = iconv.encode(finalContent, 'cp936');
    const feedPaperAndCutCommandBuffer = Buffer.from('\x1DVA\x02');
    const bufferToPrint = Buffer.concat([resetCommandBuffer, documentContentBuffer, feedPaperAndCutCommandBuffer]);

    return connectAndSendDocumentToPrinter(hostname, port, bufferToPrint);
  });

function* printDocumentAsync(action) {
  try {
    yield put(Actions.printDocumentInProgress(action.payload));
    yield call(print, action.payload.get('documents'));
    yield put(Actions.printDocumentSucceeded(action.payload));
  } catch (exception) {
    yield put(Actions.printDocumentFailed(action.payload.set('errorMessage', exception.message)));
  }
}

export default function* watchPrintDocument() {
  yield takeEvery(ActionTypes.ESC_POS_PRINTER_PRINT_DOCUMENT, printDocumentAsync);
}
