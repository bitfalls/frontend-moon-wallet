import { all, takeLatest, call, put, fork, select, take, race } from 'redux-saga/effects';
import { delay } from 'redux-saga';
import { get } from '../../utils/fetch';
import { fetchBalances, START_BALANCES_POLL, END_BALANCES_POLL } from '../../redux/modules/wallet/balances';
import { verifyTransferFunds } from '../../redux/modules/wallet/transferFunds';


function* fetchBalancesIterator({ payload }) {
  try {
    const data = yield call(get, `/dashboard?walletAddress=${payload}`);
    yield put(fetchBalances.success(data));
  } catch (e) {
    yield put(fetchBalances.failure(e));
  }
}

function* fetchBalancesSaga() {
  yield takeLatest(
    [
      fetchBalances.REQUEST,
      verifyTransferFunds.SUCCESS
    ],
    fetchBalancesIterator
  );
}


const getSelectedWallet = (state) => state.wallet.selectedWallet;

function* pollBalancesIterator() {
  while (true) {
    try {
      yield call(delay, 10000);
      const selectedWallet = yield select(getSelectedWallet);
      const data = yield call(get, `/dashboard?walletAddress=${selectedWallet}`);
      yield put(fetchBalances.success(data));
    } catch (e) {
      yield call(console.log, e);
    }
  }
}

function* pollBalancesSaga() {
  while (true) {
    yield take(START_BALANCES_POLL);
    yield race([
      call(pollBalancesIterator),
      take(END_BALANCES_POLL)
    ]);
  }
}


export default function* () {
  yield all([
    fork(fetchBalancesSaga),
    fork(pollBalancesSaga)
  ]);
}
