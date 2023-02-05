import { Service } from 'typedi';
import { log } from '@core/log/log';
import { LogLevels } from '@core/log/log.model';
import { exchange } from '@exchange/exchange.factory';
import { Strategies, StrategyServices } from '@strategy/strategy.model';
import { TriangularOrderBooks } from './strategy.triangular-arbitrage.order-books';
import { findAllTriangularPairs, sleep } from './strategy.triangular-arbitrage.utils';

const MINIMUM_PROFIT = 0.01;

@Service()
export class StrategyTriangularArbitrageService implements StrategyServices {
  private isRunning = true;
  private mainAssetBalance = 350;
  private isStopAfterTrade = false;

  private triangularOrderBooks: TriangularOrderBooks;

  async start() {
    log(LogLevels.INFO, 'strategy.start', [Strategies.TRIANGULAR_ARBITRAGE]);

    const markets = await exchange.loadSpotMarket();

    const availableTriangularPairs = findAllTriangularPairs(markets);

    if (!availableTriangularPairs.length) {
      return log(LogLevels.ERROR, 'triangular-arbitrage.error.no-pairs-available', [exchange.getName()]);
    }

    console.log(availableTriangularPairs[0]);

    this.triangularOrderBooks = new TriangularOrderBooks(availableTriangularPairs[0]);

    this.findTriangularArbitrage();
  }

  private async findTriangularArbitrage() {
    while (this.isRunning) {
      const result = this.triangularOrderBooks.simulateTrade(this.mainAssetBalance);
      await this.executeTriangularArbitrage(result - this.mainAssetBalance);
    }
  }

  private async executeTriangularArbitrage(potentialProfit: number) {
    if (potentialProfit < MINIMUM_PROFIT) {
      return sleep();
    }

    // const result = await this.triangularOrderBooks.executeTrade(this.mainAssetBalance);

    console.log(`Trade executed, Real Result: ${0} vs PotentialProfit: ${potentialProfit}`);

    if (this.isStopAfterTrade) {
      this.stop();
    }
  }

  stop() {
    this.isRunning = false;
    this.triangularOrderBooks.stopOrderBooks();
    exchange.close();
  }

  stopAfterTrade() {
    this.isStopAfterTrade = true;
  }
}
