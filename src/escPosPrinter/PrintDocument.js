// @flow

import { Range } from 'immutable';
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

const print = async (hostname, port, documentContent, numberOfCopies) => {
  var finalDocumentContent = documentContent;
  var indexOfCommandCode = finalDocumentContent.indexOf('##');

  while (indexOfCommandCode !== -1) {
    const part1 = finalDocumentContent.substring(0, indexOfCommandCode);
    const part2 = finalDocumentContent.substring(indexOfCommandCode + 4);
    const commandCode = finalDocumentContent.substring(indexOfCommandCode + 2, indexOfCommandCode + 4);

    finalDocumentContent = part1 + parseInt('0x' + commandCode) + part2;

    indexOfCommandCode = finalDocumentContent.indexOf('##');
  }

  const resetCommandBuffer = Buffer.from('\x1B@\x00');
  const documentContentBuffer = iconv.encode(finalDocumentContent, 'cp936');
  const feedPaperAndCutCommandBuffer = Buffer.from('\x1DVA\x02');
  const bufferToPrint = Buffer.concat([resetCommandBuffer, documentContentBuffer, feedPaperAndCutCommandBuffer]);

  return BluebirdPromise.each(Range(0, numberOfCopies ? numberOfCopies : 1).toArray(), () =>
    connectAndSendDocumentToPrinter(hostname, port, bufferToPrint),
  );
};

function* printDocumentAsync(action) {
  try {
    yield put(Actions.printDocumentInProgress(action.payload));
    yield call(
      print,
      action.payload.get('hostname'),
      action.payload.get('port'),
      action.payload.get('documentContent'),
      action.payload.get('numberOfCopies'),
    );
    yield put(Actions.printDocumentSucceeded(action.payload));
  } catch (exception) {
    yield put(Actions.printDocumentFailed(action.payload.set('errorMessage', exception.message)));
  }
}

export default function* watchPrintDocument() {
  yield takeEvery(ActionTypes.ESC_POS_PRINTER_PRINT_DOCUMENT, printDocumentAsync);
}
