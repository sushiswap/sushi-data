export type User = {
    id?: string,
    liquidityPositions?: LiquidityPosition[]
}


export type Bundle = {
    id?: string,
    ethPrice?: string
}


export type Factory = {
    id?: string,
    pairCount?: string,
    volumeUSD?: string,
    volumeETH?: string,
    untrackedVolumeUSD?: string,
    liquidityUSD?: string,
    liquidityETH?: string,
    txCount?: string,
    tokenCount?: string,
    userCount?: string,
    pairs?: Pair[],
    tokens?: Token[],
    hourData?: HourData[],
    dayData?: DayData[]
}


export type HourData = {
    id?: string,
    date?: string,
    factory?: Factory,
    volumeETH?: string,
    volumeUSD?: string,
    untrackedVolume?: string,
    liquidityETH?: string,
    liquidityUSD?: string,
    txCount?: string
}


export type DayData = {
    id?: string,
    date?: string,
    factory?: Factory,
    volumeETH?: string,
    volumeUSD?: string,
    untrackedVolume?: string,
    liquidityETH?: string,
    liquidityUSD?: string,
    txCount?: string
}


export type Token = {
    id?: string,
    factory?: Factory,
    symbol?: string,
    name?: string,
    decimals?: string,
    totalSupply?: string,
    volume?: string,
    volumeUSD?: string,
    untrackedVolumeUSD?: string,
    txCount?: string,
    liquidity?: string,
    derivedETH?: string,
    hourData?: TokenHourData[],
    dayData?: TokenDayData[],
    basePairs?: Pair[],
    quotePairs?: Pair[],
    basePairsDayData?: PairDayData[],
    quotePairsDayData?: PairDayData[]
}


export type TokenHourData = {
    id?: string,
    date?: string,
    token?: Token,
    volume?: string,
    volumeETH?: string,
    volumeUSD?: string,
    txCount?: string,
    liquidity?: string,
    liquidityETH?: string,
    liquidityUSD?: string,
    priceUSD?: string
}


export type TokenDayData = {
    id?: string,
    date?: string,
    token?: Token,
    volume?: string,
    volumeETH?: string,
    volumeUSD?: string,
    txCount?: string,
    liquidity?: string,
    liquidityETH?: string,
    liquidityUSD?: string,
    priceUSD?: string
}


export type Pair = {
    id?: string,
    factory?: Factory,
    name?: string,
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
    liquidityProviderCount?: string,
    liquidityPositions?: LiquidityPosition[],
    liquidityPositionSnapshots?: LiquidityPositionSnapshot[],
    dayData?: PairDayData[],
    hourData?: PairHourData[],
    mints?: Mint[],
    burns?: Burn[],
    swaps?: Swap[],
    timestamp?: string,
    block?: string
}


export type PairHourData = {
    id?: string,
    date?: string,
    pair?: Pair,
    reserve0?: string,
    reserve1?: string,
    reserveUSD?: string,
    volumeToken0?: string,
    volumeToken1?: string,
    volumeUSD?: string,
    txCount?: string
}


export type PairDayData = {
    id?: string,
    date?: string,
    pair?: Pair,
    token0?: Token,
    token1?: Token,
    reserve0?: string,
    reserve1?: string,
    totalSupply?: string,
    reserveUSD?: string,
    volumeToken0?: string,
    volumeToken1?: string,
    volumeUSD?: string,
    txCount?: string
}


export type LiquidityPosition = {
    id?: string,
    user?: User,
    pair?: Pair,
    liquidityTokenBalance?: string,
    snapshots?: LiquidityPositionSnapshot[],
    block?: string,
    timestamp?: string
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
    complete?: string,
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