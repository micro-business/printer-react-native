// @flow

import { Map, Range } from 'immutable';
import BluebirdPromise from 'bluebird';
import { call, put, takeEvery } from 'redux-saga/effects';
import net from 'react-native-tcp';
import ActionTypes from './ActionTypes';
import * as Actions from './Actions';

const internationalCharacterSet = Map()
  .set('en', 0x00)
  .set('en_AU', 0x00)
  .set('en_BZ', 0x00)
  .set('en_BW', 0x00)
  .set('en_CA', 0x00)
  .set('en_CB', 0x00)
  .set('en_DK', 0x00)
  .set('en_IE', 0x00)
  .set('en_JM', 0x00)
  .set('en_NZ', 0x00)
  .set('en_PH', 0x00)
  .set('en_ZA', 0x00)
  .set('en_TT', 0x00)
  .set('en_GB', 0x03)
  .set('en_US', 0x00)
  .set('en_ZW', 0x00)
  .set('fr', 0x01)
  .set('fr_FR', 0x01)
  .set('fr_BE', 0x01)
  .set('fr_CA', 0x01)
  .set('fr_LU', 0x01)
  .set('fr_MC', 0x01)
  .set('fr_CH', 0x01)
  .set('de', 0x02)
  .set('de_DE', 0x02)
  .set('de_AT', 0x02)
  .set('de_BE', 0x02)
  .set('de_LI', 0x02)
  .set('de_LU', 0x02)
  .set('de_CH', 0x02)
  .set('da_DK', 0x04)
  .set('sv', 0x05)
  .set('sv_SE', 0x05)
  .set('sv_FI', 0x05)
  .set('it', 0x06)
  .set('it_IT', 0x06)
  .set('it_CH', 0x06)
  .set('es', 0x07)
  .set('es_ES', 0x07)
  .set('es_AR', 0x07)
  .set('es_BO', 0x07)
  .set('es_CL', 0x07)
  .set('es_CO', 0x07)
  .set('es_CR', 0x07)
  .set('es_DO', 0x07)
  .set('es_EC', 0x07)
  .set('es_SV', 0x07)
  .set('es_GT', 0x07)
  .set('es_HN', 0x07)
  .set('es_MX', 0x07)
  .set('es_NI', 0x07)
  .set('es_PA', 0x07)
  .set('es_PY', 0x07)
  .set('es_PE', 0x07)
  .set('es_PR', 0x07)
  .set('es_UY', 0x07)
  .set('es_US', 0x07)
  .set('es_VE', 0x07)
  .set('ja', 0x08)
  .set('ja_JP', 0x08)
  .set('jp', 0x08) // TODO: this must be removed once we fix the error where using 'jp' as japanese language code
  .set('nb', 0x09)
  .set('nb_NO', 0x09)
  .set('nn', 0x09)
  .set('nn_NO', 0x09)
  .set('ko', 0x0d)
  .set('ko_KR', 0x0d)
  .set('sk', 0x0e)
  .set('sk_SK', 0x0e)
  .set('zh', 0x0f)
  .set('zh_TW', 0x0f)
  .set('zh_HK', 0x0f)
  .set('zh_MO', 0x0f)
  .set('zh_CN', 0x0f)
  .set('zh_SG', 0x0f)
  .set('vi', 0x10)
  .set('vi_VN', 0x10)
  .set('ar', 0x11)
  .set('ar_DZ', 0x11)
  .set('ar_BH', 0x11)
  .set('ar_EG', 0x11)
  .set('ar_IQ', 0x11)
  .set('ar_JO', 0x11)
  .set('ar_KW', 0x11)
  .set('ar_LB', 0x11)
  .set('ar_LY', 0x11)
  .set('ar_MA', 0x11)
  .set('ar_OM', 0x11)
  .set('ar_QA', 0x11)
  .set('ar_SA', 0x11)
  .set('ar_SD', 0x11)
  .set('ar_SY', 0x11)
  .set('ar_TN', 0x11)
  .set('ar_AE', 0x11)
  .set('ar_YE', 0x11);

const connectAndSendDocumentToPrinter = (hostname, port, documentContent, language) =>
  new Promise((resolve, reject) => {
    const socket = net.createConnection(port, hostname, () => {
      const resetCommand = String.fromCharCode(0x1b) + '@\r\n';
      const characterSetCommand =
        String.fromCharCode(0x1b) +
        'R' +
        String.fromCharCode(internationalCharacterSet.has(language) ? internationalCharacterSet.get(language) : internationalCharacterSet.get('en')) +
        '\r\n';
      const feedPaperAndCutCommand = String.fromCharCode(0x1d) + 'VA\r\n';

      if (socket.write(resetCommand + characterSetCommand + documentContent + feedPaperAndCutCommand)) {
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

const print = async (hostname, port, documentContent, language, numberOfCopies) =>
  BluebirdPromise.each(Range(0, numberOfCopies ? numberOfCopies : 1).toArray(), () =>
    connectAndSendDocumentToPrinter(hostname, port, documentContent, language),
  );

function* printDocumentAsync(action) {
  try {
    yield put(Actions.printDocumentInProgress(action.payload));
    yield call(
      print,
      action.payload.get('hostname'),
      action.payload.get('port'),
      action.payload.get('documentContent'),
      action.payload.get('language'),
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
