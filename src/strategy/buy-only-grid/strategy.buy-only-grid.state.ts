import { Market, Order } from 'ccxt';
import { log } from '@core/log/log';
import { LogLevels } from '@core/log/log.model';
import { OrderSides } from '@exchange/exchange.model';
import { Strategies } from '@strategy/strategy.model';
import { BUY_ONLY_GRID_TRADE_PAIR } from './strategy.buy-only-grid.service';
import { filterOrdersHistoryBySide, getPairMinSize } from '@exchange/exchange.utils';
import { countDecimalPlaces } from './strategy.buy-only-grid.utils';

export class BuyOnlyGridState {
  public readonly state = {
    firstPrice: 0,
    buyOrdersFilled: 0,
    currentAveragePrice: 0,
    accumulatedPurchases: 0,
    accumulatedPositionSize: 0,
  };

  private readonly baseAssetMinSize: number;

  constructor(markets: Market[]) {
    this.baseAssetMinSize = countDecimalPlaces(getPairMinSize(markets, BUY_ONLY_GRID_TRADE_PAIR));
  }

  updateState(order: Order) {
    this.state.buyOrdersFilled += 1;
    this.state.accumulatedPurchases += order.cost;
    this.state.accumulatedPositionSize += order.filled;
    this.state.accumulatedPositionSize = parseFloat(this.state.accumulatedPositionSize.toFixed(this.baseAssetMinSize));
    this.state.currentAveragePrice = this.state.accumulatedPurchases / this.state.accumulatedPositionSize;

    log(LogLevels.INFO, 'buy-only-grid.state.update-state', [Strategies.BUY_ONLY_GRID, order, this.state]);
  }

  reconstructState(baseAssetBalance: number, ordersHistory: Order[]) {
    const buyOrdersHistory = filterOrdersHistoryBySide(ordersHistory, OrderSides.BUY);
    let order = buyOrdersHistory?.pop();

    this.resetState();

    while (buyOrdersHistory?.length > 0) {
      this.updateState(order);
      this.state.firstPrice = order.average;

      order = buyOrdersHistory.pop();

      if (
        parseFloat((this.state.accumulatedPositionSize + order.filled).toFixed(this.baseAssetMinSize)) >
        baseAssetBalance
      ) {
        break;
      }
    }

    log(LogLevels.INFO, 'buy-only-grid.state.reconstruct-state', [Strategies.BUY_ONLY_GRID, this.state]);
  }

  resetState() {
    for (const key of Object.keys(this.state)) {
      this.state[key] = 0;
    }
  }
}
