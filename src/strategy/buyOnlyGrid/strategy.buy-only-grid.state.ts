import { Order } from 'ccxt';
import { Service } from 'typedi';
import { log } from '@core/log/log';
import { LogLevels } from '@core/log/log.model';
import { OrderSides } from '@exchange/exchange.model';
import { Strategies } from '@strategy/strategy.model';
import { filterOrdersHistoryBySide } from '@exchange/exchange.utils';

@Service()
export class BuyOnlyGridState {
  public readonly state = {
    firstPrice: 0,
    buyOrdersFilled: 0,
    currentAveragePrice: 0,
    accumulatedPurchases: 0,
    accumulatedPositionSize: 0,
  };

  updateState(order: Order, baseAssetMinSize: number) {
    this.state.buyOrdersFilled += 1;
    this.state.accumulatedPurchases += order.cost;
    this.state.accumulatedPositionSize += order.filled;
    this.state.accumulatedPositionSize = parseFloat(this.state.accumulatedPositionSize.toFixed(baseAssetMinSize));
    this.state.currentAveragePrice = this.state.accumulatedPurchases / this.state.accumulatedPositionSize;

    log(LogLevels.INFO, 'buyonlygrid.state.update-state', [Strategies.BUY_ONLY_GRID, order, this.state]);
  }

  reconstructState(baseAssetBalance: number, ordersHistory: Order[], baseAssetMinSize: number) {
    const buyOrdersHistory = filterOrdersHistoryBySide(ordersHistory, OrderSides.BUY);
    let order = buyOrdersHistory?.pop();

    this.resetState();

    while (buyOrdersHistory?.length > 0) {
      this.updateState(order, baseAssetMinSize);
      this.state.firstPrice = order.average;

      order = buyOrdersHistory.pop();

      if (
        parseFloat((this.state.accumulatedPositionSize + order.filled).toFixed(baseAssetMinSize)) > baseAssetBalance
      ) {
        break;
      }
    }

    log(LogLevels.INFO, 'buyonlygrid.state.reconstruct-state', [Strategies.BUY_ONLY_GRID, this.state]);
  }

  resetState() {
    for (const key of Object.keys(this.state)) {
      this.state[key] = 0;
    }
  }
}
