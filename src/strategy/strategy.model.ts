export interface StrategyServices {
  start(): void;
  stop(): void;
  stopAfterTrade(): void;
}

export enum Strategies {
  BUY_ONLY_GRID = 'BUY_ONLY_GRID',
}
