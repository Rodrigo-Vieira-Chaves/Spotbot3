import { Order } from 'ccxt';
import { Service } from 'typedi';
import { log } from '@core/log/log';
import { LogLevels } from '@core/log/log.model';
import { exchange } from '@exchange/exchange.factory';
import { BuyOnlyGridState } from './strategy.buy-only-grid.state';
import { BASE_ASSET, QUOTE_ASSET } from '@core/env/load-env-data';
import { OrderSides, OrderStatus } from '@exchange/exchange.model';
import { Strategies, StrategyServices } from '@strategy/strategy.model';
import { hasPair, getSpecificAssetBalance, makePair } from '@exchange/exchange.utils';
import {
  calculateMaxBuyOrderSize,
  calculateNextBuyPrice,
  calculateNextBuySize,
  calculateNextSellPrice,
  sendLimitOrder,
  sendMarketOrder,
} from './strategy.buy-only-grid.utils';

export const BUY_ONLY_GRID_STOP_GAIN = 1.5;
export const BUY_ONLY_GRID_GRID_DISTANCE = 1.5;
export const BUY_ONLY_GRID_FALL_TOLERANCE = 50;

export const BUY_ONLY_GRID_MINIMUM_BALANCE = 350;

export const BUY_ONLY_GRID_TRADE_PAIR = makePair(BASE_ASSET, QUOTE_ASSET);

@Service()
export class StrategyBuyOnlyGridService implements StrategyServices {
  private currentBalance = 0;
  private maxBuyOrderSize = 0;

  private runWatchOrders = true;
  private isStopAfterTrade = false;

  private gridState: BuyOnlyGridState;

  async start() {
    log(LogLevels.INFO, 'strategy.start', [Strategies.BUY_ONLY_GRID]);

    const markets = await exchange.loadSpotMarket();
    const isPairExistent = hasPair(markets, BUY_ONLY_GRID_TRADE_PAIR);

    if (!isPairExistent) {
      return log(LogLevels.ERROR, 'buy-only-grid.error.pair-non-existent', [
        BUY_ONLY_GRID_TRADE_PAIR,
        exchange.getName(),
      ]);
    }

    this.gridState = new BuyOnlyGridState(markets);

    const balances = await exchange.fetchTotalBalance();
    const baseAssetBalance = getSpecificAssetBalance(balances, BASE_ASSET);

    if (baseAssetBalance > 0) {
      await this.reconstructState(baseAssetBalance);
    } else {
      this.gridState.resetState();
    }

    this.watchOrders();

    return this.initCycle();
  }

  private async reconstructState(baseAssetBalance: number) {
    const ordersHistory = await exchange.fetchClosedOrders(BUY_ONLY_GRID_TRADE_PAIR);

    this.gridState.reconstructState(baseAssetBalance, ordersHistory);

    log(LogLevels.INFO, 'buy-only-grid.state.reconstructed', [BASE_ASSET, this.gridState.state.currentAveragePrice]);
  }

  private async initCycle() {
    await this.updateQuoteAssetBalance();

    if (this.gridState.state.accumulatedPurchases > 0) {
      this.currentBalance += this.gridState.state.accumulatedPurchases;
    }

    if (!this.currentBalance || this.currentBalance < BUY_ONLY_GRID_MINIMUM_BALANCE) {
      return log(LogLevels.ERROR, 'buy-only-grid.error.min-balance', [BUY_ONLY_GRID_MINIMUM_BALANCE, QUOTE_ASSET]);
    }

    this.maxBuyOrderSize = calculateMaxBuyOrderSize(this.currentBalance);

    log(LogLevels.INFO, 'strategy.enough-balance', [Strategies.BUY_ONLY_GRID]);

    this.initCycleStep();
  }

  private async updateQuoteAssetBalance() {
    const balances = await exchange.fetchTotalBalance();
    this.currentBalance = getSpecificAssetBalance(balances, QUOTE_ASSET);
  }

  private async initCycleStep() {
    await exchange.cancelAllOrders(BUY_ONLY_GRID_TRADE_PAIR);

    log(LogLevels.INFO, 'strategy.orders.cancelled', []);

    if (this.gridState.state.buyOrdersFilled <= 0) {
      return sendMarketOrder(OrderSides.BUY, this.maxBuyOrderSize);
    }

    if (this.currentBalance >= this.maxBuyOrderSize) {
      await this.sendNextBuyOrder();
    } else {
      log(LogLevels.WARN, 'buy-only-grid.error.no-balance-to-send-order', [this.currentBalance, this.maxBuyOrderSize]);
    }

    const nextSellPrice = calculateNextSellPrice(this.gridState.state.currentAveragePrice);
    return sendLimitOrder(OrderSides.SELL, this.gridState.state.accumulatedPositionSize, nextSellPrice);
  }

  private async sendNextBuyOrder() {
    const nextBuyPrice = calculateNextBuyPrice(this.gridState.state.firstPrice, this.gridState.state.buyOrdersFilled);
    const nextBuySize = calculateNextBuySize(this.maxBuyOrderSize, nextBuyPrice);

    return sendLimitOrder(OrderSides.BUY, nextBuySize, nextBuyPrice);
  }

  private async watchOrders() {
    while (this.runWatchOrders) {
      const result = await exchange.watchOrders(BUY_ONLY_GRID_TRADE_PAIR);
      this.processReceivedOrder(result?.pop());
    }
  }

  private async processReceivedOrder(order: Order) {
    if (order?.status !== OrderStatus.CLOSED) {
      return;
    }

    log(LogLevels.INFO, 'strategy.orders.filled', [order.side, order.type, order.filled, BASE_ASSET, order.average]);

    if (order.side === OrderSides.BUY) {
      return this.processBuyFilledOrder(order);
    }

    return this.processSellFilledOrder();
  }

  private async processBuyFilledOrder(order: Order) {
    if (this.gridState.state.buyOrdersFilled <= 0) {
      this.gridState.state.firstPrice = order.average;
    }

    await this.updateQuoteAssetBalance();
    this.gridState.updateState(order);

    return this.initCycleStep();
  }

  private async processSellFilledOrder() {
    if (this.isStopAfterTrade) {
      return this.stop();
    }

    this.gridState.resetState();

    return this.initCycle();
  }

  async stop() {
    await exchange.cancelAllOrders(BUY_ONLY_GRID_TRADE_PAIR);
    this.runWatchOrders = false;
    exchange.close();
  }

  stopAfterTrade() {
    this.isStopAfterTrade = true;
  }
}
