type Token = {
    id: string,
    symbol: string,
    name: string,
    decimals: number,
    totalSupply: number,
    volume: number,
    volumeUSD: number,
    untrackedVolumeUSD: number,
    txCount: number,
    liquidity: number,
    derivedETH: number
};

export function token({ block, timestamp, token_address }: {
    block?: number;
    timestamp?: number;
    token_address: string;
}): Promise<Token>;

export function observeToken({ token_address }: {
    token_address: string;
}): {
    subscribe({ next, error, complete }: {
        next?(data: Token): any;
        error?(error: any): any;
        complete?: Function;
    }): any;
};

export function tokens({ block, timestamp, max }?: {
    block?: number;
    timestamp?: number;
    max?: number;
}): Promise<Token[]>;

export function observeTokens(): {
    subscribe({ next, error, complete }: {
        next?(data: Token[]): any;
        error?(error: any): any;
        complete?: Function;
    }): any;
};



type Pair = {
    id: string,
    token0: { 
        id: string,
        name: string,
        symbol: string,
        totalSupply: number,
        derivedETH: number,
    },
    token1: { 
        id: string,
        name: string,
        symbol: string,
        totalSupply: number,
        derivedETH: number,
    },
    reserve0: number,
    reserve1: number,
    totalSupply: number,
    reserveETH: number,
    reserveUSD: number,
    trackedReserveETH: number,
    token0Price: number,
    token1Price: number,
    volumeToken0: number,
    volumeToken1: number,
    volumeUSD: number,
    untrackedVolumeUSD: number,
    txCount: number,
}

export function pair({ block, timestamp, pair_address }: {
    block?: number;
    timestamp?: number;
    pair_address: string;
}): Promise<Pair>;

export function observePair({ pair_address }: {
    pair_address: string;
}): {
    subscribe({ next, error, complete }: {
        next?(data: Pair): any;
        error?(error: any): any;
        complete?: Function;
    }): any;
};

export function pairs({ block, timestamp, max }?: {
    block?: number;
    timestamp?: number;
    max?: number;
}): Promise<Pair[]>;

export function observePairs(): {
    subscribe({ next, error, complete }: {
        next(data: Pair): any;
        error?(error: any): any;
        complete?: Function;
    }): any;
};



type EthPrice = number;

export function ethPrice({ block, timestamp }?: {
    block?: number;
    timestamp?: number;
}): Promise<EthPrice>;

export function observeEthPrice(): {
    subscribe({ next, error, complete }: {
        next?(data: EthPrice): any;
        error?(error: any): any;
        complete?: Function;
    }): any;
};



type Factory = {
    pairCount: number;
    volumeUSD: number;
    volumeETH: number;
    untrackedVolumeUSD: number;
    liquidityUSD: number;
    liquidityETH: number;
    txCount: number;
    tokenCount: number;
    userCount: number;
}

export function factory({ block, timestamp }?: {
    block?: number;
    timestamp?: number;
}): Promise<Factory>;

export function observeFactory(): {
    subscribe({ next, error, complete }: {
        next?(data: Factory): any;
        error?(error: any): any;
        complete?: Function;
    }): any;
};



type DayData = {
    id: number,
    date: Date,
    volumeETH: number,
    volumeUSD: number,
    liquidityETH: number,
    liquidityUSD: number,
    txCount: number,
}

export function dayData({ minTimestamp, maxTimestamp, minBlock, maxBlock }?: {
    minTimestamp?: number;
    maxTimestamp?: number;
    minBlock?: number;
    maxBlock?: number;
}): Promise<DayData[]>;



type TwentyFourHourData = {
    id: string,
    volumeUSD: number,
    volumeETH: number,
    untrackedVolumeUSD: number,
    liquidityETH: number,
    liquidityUSD: number,
    txCount: number,
    pairCount: number
}

export function twentyFourHourData({ block, timestamp }? : {
    block?: number;
    timestamp?: number;
}): Promise<TwentyFourHourData>