export function simulateMarketBuy(quoteBalance: number, asks: [number, number][]) {
  let baseBalance = 0;

  for (const ask of asks) {
    const price = ask[0];
    const baseSize = ask[1];

    const quoteSize = price * baseSize;

    if (quoteSize >= quoteBalance) {
      return quoteBalance / price + baseBalance;
    }

    quoteBalance -= quoteSize;
    baseBalance += baseSize;
  }

  throw new Error(`Not enough liquidity to buy ${quoteBalance}`);
}

export function simulateMarketSell(baseBalance: number, bids: [number, number][]) {
  let quoteBalance = 0;

  for (const bid of bids) {
    const price = bid[0];
    const baseSize = bid[1];

    if (baseSize >= baseBalance) {
      return baseBalance * price + quoteBalance;
    }

    baseBalance -= baseSize;
    quoteBalance += baseSize * price;
  }

  throw new Error(`Not enough liquidity to sell ${baseBalance}`);
}
