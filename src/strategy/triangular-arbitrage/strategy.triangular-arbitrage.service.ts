import { Service } from 'typedi';
import { OrderBook } from 'ccxt';
import { log } from '@core/log/log';
import { LogLevels } from '@core/log/log.model';
import { MAIN_ASSET } from '@core/env/load-env-data';
import { exchange } from '@exchange/exchange.factory';
import { Strategies, StrategyServices } from '@strategy/strategy.model';
import { simulateMarketBuy, simulateMarketSell } from './strategy.triangular-arbitrage.utils';
import {
  checkPairsExistenceInMarket,
  filterMarketByPairsWithAsset,
  filterMarketByPairsWithoutAsset,
  getBaseAsset,
  getOppositeAsset,
  getQuoteAsset,
  isBaseAsset,
} from '@exchange/exchange.utils';

@Service()
export class StrategyTriangularArbitrageService implements StrategyServices {
  private runWatchOrderBook = true;
  private isStopAfterTrade = false;
  private mainAssetBalance = 400;
  private accumulatedProfit = 0;
  private previousProfit = 0;
  private inProfit = false;
  private time = 0;

  private readonly triangularPairs: string[] = [];

  private readonly startPairBooks: OrderBook[] = [];
  private readonly midPairBooks: OrderBook[] = [];
  private readonly finalPairBooks: OrderBook[] = [];

  async start() {
    log(LogLevels.INFO, 'strategy.start', [Strategies.TRIANGULAR_ARBITRAGE]);

    const markets = await exchange.loadSpotMarket();

    const pairsWithMainAsset = filterMarketByPairsWithAsset(markets, MAIN_ASSET);
    const pairsWithoutMainAsset = filterMarketByPairsWithoutAsset(markets, MAIN_ASSET);

    const availableTriangularPairs: string[][] = [];

    for (const midPair of pairsWithoutMainAsset) {
      const firstPair = `${getBaseAsset(midPair.symbol)}/${MAIN_ASSET}`;
      const finalPair = `${getQuoteAsset(midPair.symbol)}/${MAIN_ASSET}`;

      if (checkPairsExistenceInMarket(pairsWithMainAsset, [firstPair, finalPair]).length == 0) {
        availableTriangularPairs.push([firstPair, midPair.symbol, finalPair]);
      }
    }

    if (!availableTriangularPairs.length) {
      return log(LogLevels.ERROR, 'triangular-arbitrage.error.no-pairs-available', [exchange.getName()]);
    }

    console.log(availableTriangularPairs[0]);

    this.triangularPairs.push(...availableTriangularPairs[0]);

    this.updateStartPairOrderBook();
    this.updateMidPairOrderBook();
    this.updateFinalPairOrderBook();

    setInterval(this.simulateTriangularArbitrage.bind(this));
  }

  private async simulateTriangularArbitrage() {
    let tradeResult = { asset: MAIN_ASSET, balance: this.mainAssetBalance };

    if (!(this.startPairBooks.length && this.midPairBooks.length && this.finalPairBooks.length)) {
      return;
    }

    const orderBooks = [
      this.startPairBooks.splice(0).pop(),
      this.midPairBooks.splice(0).pop(),
      this.finalPairBooks.splice(0).pop(),
    ];

    this.triangularPairs.forEach((pair, index) => {
      tradeResult = this.simulateTrade(tradeResult.asset, tradeResult.balance, pair, orderBooks[index]);
    });

    if (tradeResult.balance <= this.mainAssetBalance) {
      if (this.inProfit) {
        this.inProfit = false;
        console.log(
          `Profit ended => Accumulated Profit: ${this.accumulatedProfit}, duration: ${
            (Date.now() - this.time) / 1000
          }s`,
        );
      }
      return;
    }

    const profit = tradeResult.balance - this.mainAssetBalance;

    if (profit === this.previousProfit || profit < 0.001) {
      return;
    }

    if (!this.inProfit) {
      this.inProfit = true;
      this.time = Date.now();
      this.accumulatedProfit += profit;
    }

    this.previousProfit = profit;

    // console.log(
    //   `Profit ${profit}, +${(profit / this.mainAssetBalance) * 100} %, accumulated: ${
    //     this.accumulatedProfit
    //   }, opportunity duration: ${this.timeDiff / 1000}`,
    // );
  }

  private simulateTrade(asset: string, assetBalance: number, pair: string, pairOrderBook: OrderBook) {
    const oppositeAsset = getOppositeAsset(asset, pair);

    const balance = isBaseAsset(asset, pair)
      ? simulateMarketSell(assetBalance, pairOrderBook.bids)
      : simulateMarketBuy(assetBalance, pairOrderBook.asks);

    return { balance, asset: oppositeAsset };
  }

  private async updateStartPairOrderBook() {
    while (this.runWatchOrderBook) {
      const result = await exchange.watchOrderBook(this.triangularPairs[0]);
      this.startPairBooks.push(result);
    }
  }

  private async updateMidPairOrderBook() {
    while (this.runWatchOrderBook) {
      const result = await exchange.watchOrderBook(this.triangularPairs[1]);
      this.midPairBooks.push(result);
    }
  }

  private async updateFinalPairOrderBook() {
    while (this.runWatchOrderBook) {
      const result = await exchange.watchOrderBook(this.triangularPairs[2]);
      this.finalPairBooks.push(result);
    }
  }

  async stop() {
    this.runWatchOrderBook = false;
    exchange.close();
  }

  stopAfterTrade() {
    this.isStopAfterTrade = true;
  }
}
