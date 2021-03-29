export type UniswapFactory = {
    id?: string,
    pairCount?: string,
    totalVolumeUSD?: string,
    totalVolumeETH?: string,
    untrackedVolumeUSD?: string,
    totalLiquidityUSD?: string,
    totalLiquidityETH?: string,
    txCount?: string
}


export type Token = {
    id?: string,
    symbol?: string,
    name?: string,
    decimals?: string,
    totalSupply?: string,
    tradeVolume?: string,
    tradeVolumeUSD?: string,
    untrackedVolumeUSD?: string,
    txCount?: string,
    totalLiquidity?: string,
    derivedETH?: string
}


export type Pair = {
    id?: string,
    token0?: Token,
    token1?: Token,
    reserve0?: string,
    reserve1?: string,
    totalSupply?: string,
    reserveETH?: string,
    reserveUSD?: string,
    trackedReserveETH?: string,
    token0Price?: string,
    token1Price?: string,
    volumeToken0?: string,
    volumeToken1?: string,
    volumeUSD?: string,
    untrackedVolumeUSD?: string,
    txCount?: string,
    createdAtTimestamp?: string,
    createdAtBlockNumber?: string,
    liquidityProviderCount?: string
}


export type User = {
    id?: string,
    liquidityPositions?: LiquidityPosition[],
    usdSwapped?: string
}


export type LiquidityPosition = {
    id?: string,
    user?: User,
    pair?: Pair,
    liquidityTokenBalance?: string,
    historicalSnapshots?: LiquidityPositionSnapshot[]
}


export type LiquidityPositionSnapshot = {
    id?: string,
    liquidityPosition?: LiquidityPosition,
    timestamp?: string,
    block?: string,
    user?: User,
    pair?: Pair,
    token0PriceUSD?: string,
    token1PriceUSD?: string,
    reserve0?: string,
    reserve1?: string,
    reserveUSD?: string,
    liquidityTokenTotalSupply?: string,
    liquidityTokenBalance?: string
}


export type Transaction = {
    id?: string,
    blockNumber?: string,
    timestamp?: string,
    mints?: Mint[],
    burns?: Burn[],
    swaps?: Swap[]
}


export type Mint = {
    id?: string,
    transaction?: Transaction,
    timestamp?: string,
    pair?: Pair,
    to?: string,
    liquidity?: string,
    sender?: string,
    amount0?: string,
    amount1?: string,
    logIndex?: string,
    amountUSD?: string,
    feeTo?: string,
    feeLiquidity?: string
}


export type Burn = {
    id?: string,
    transaction?: Transaction,
    timestamp?: string,
    pair?: Pair,
    liquidity?: string,
    sender?: string,
    amount0?: string,
    amount1?: string,
    to?: string,
    logIndex?: string,
    amountUSD?: string,
    needsComplete?: string,
    feeTo?: string,
    feeLiquidity?: string
}


export type Swap = {
    id?: string,
    transaction?: Transaction,
    timestamp?: string,
    pair?: Pair,
    sender?: string,
    amount0In?: string,
    amount1In?: string,
    amount0Out?: string,
    amount1Out?: string,
    to?: string,
    logIndex?: string,
    amountUSD?: string
}


export type Bundle = {
    id?: string,
    ethPrice?: string
}


export type UniswapDayData = {
    id?: string,
    date?: string,
    dailyVolumeETH?: string,
    dailyVolumeUSD?: string,
    dailyVolumeUntracked?: string,
    totalVolumeETH?: string,
    totalLiquidityETH?: string,
    totalVolumeUSD?: string,
    totalLiquidityUSD?: string,
    txCount?: string
}


export type PairHourData = {
    id?: string,
    hourStartUnix?: string,
    pair?: Pair,
    reserve0?: string,
    reserve1?: string,
    reserveUSD?: string,
    hourlyVolumeToken0?: string,
    hourlyVolumeToken1?: string,
    hourlyVolumeUSD?: string,
    hourlyTxns?: string
}


export type PairDayData = {
    id?: string,
    date?: string,
    pairAddress?: string,
    token0?: Token,
    token1?: Token,
    reserve0?: string,
    reserve1?: string,
    totalSupply?: string,
    reserveUSD?: string,
    dailyVolumeToken0?: string,
    dailyVolumeToken1?: string,
    dailyVolumeUSD?: string,
    dailyTxns?: string
}


export type TokenDayData = {
    id?: string,
    date?: string,
    token?: Token,
    dailyVolumeToken?: string,
    dailyVolumeETH?: string,
    dailyVolumeUSD?: string,
    dailyTxns?: string,
    totalLiquidityToken?: string,
    totalLiquidityETH?: string,
    totalLiquidityUSD?: string,
    priceUSD?: string
}