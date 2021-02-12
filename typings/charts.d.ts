type Factory = [
    [
        {
            id: number,
            date: Date,
            volumeETH: number,
            volumeUSD: number,
            liquidityETH: number,
            liquidityUSD: number,
            txCount: number
        }
    ],
    [
        {
            date: Date,
            weeklyVolumeUSD: number
        }
    ]
];

export function factory(): Promise<Factory>;



type Token = {
    id: string,
    date: Date,
    timestamp: number,
    volume: number,
    volumeETH: number,
    volumeUSD: number,
    liquidity: number,
    liquidityETH: number,
    liquidityUSD: number,
    priceUSD: number,
    txCount: number
};

export function token({token_address}: {
    token_address: string;
}): Promise<Token[]>;



type Pair = {
    id: string,
    date: Date,
    timestamp: number,
    volumeUSD: number,
    volumeToken0: number,
    volumeToken1: number,
    liquidityUSD: number,
    txCount: number
};

export function pair({pair_address}: {
    pair_address: string;
}): Promise<Pair[]>;