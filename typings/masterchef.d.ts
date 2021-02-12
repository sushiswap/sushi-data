type Info = {
    bonusMultiplier: number;
    bonusEndBlock: number;
    devaddr: string;
    migrator: string;
    owner: string;
    startBlock: number;
    sushiPerBlock: number;
    totalAllocPoint: number;
    poolCount: number;
    slpBalance: number;
    slpAge: number;
    slpAgeRemoved: number;
    slpDeposited: number;
    slpWithdrawn: number;
    updatedAt: number;
}

export function info({ block, timestamp }?: {
    block?: number;
    timestamp?: number;
}): Promise<Info>;



type Pool = {
    id: number,
    pair: string,
    allocPoint: number,
    lastRewardBlock: number,
    accSushiPerShare: number,
    userCount: number,
    slpBalance: number,
    slpAge: number,
    slpAgeRemoved: number,
    slpDeposited: number,
    slpWithdrawn: number,
    addedTs: number,
    addedDate: Date,
    addedBlock: number,
    lastUpdatedTs: number,
    lastUpdatedDate: Date,
    entryUSD: number,
    exitUSD: number,
    sushiHarvested: number,
    sushiHarvestedUSD: number
}

export function pool({ block, timestamp, pool_id, pool_address }: {
    block?: number;
    timestamp?: number;
    pool_id: number;
    pool_address: string;
}): Promise<Pool>;

export function pools({ block, timestamp }?: {
    block?: any;
    timestamp?: any;
}): Promise<Pool[]>;



type StakedValue = {
    id: string;
    liquidityTokenBalance: number;
    totalSupply: number;
    totalValueETH: number;
    totalValueUSD: number;
}

export function stakedValue({ block, timestamp, token_address }: {
    block?: number;
    timestamp?: number;
    token_address: string;
}): Promise<StakedValue>;



type User = {
    id: string,
    address: string,
    pool: {
        id: string,
        pair: string,
        balance: number,
        accSushiPerShare: number,
        lastRewardBlock: number
    },
    amount: number,
    rewardDebt: number,
    entryUSD: number,
    exitUSD: number,
    sushiAtLockup: number,
    sushiHarvested: number,
    sushiHarvestedUSD: number,
    sushiHarvestedSinceLockup: number,
    sushiHarvestedSinceLockupUSD: number
}

export function user({ block, timestamp, user_address }: {
    block?: number;
    timestamp?: number;
    user_address: string;
}): Promise<User[]>;



export function apys({ block, timestamp}?: {
    block?: number;
    timestamp?: number;
}): Promise<(Pool & {apy: number})[]>;

export function apys24h({ block, timestamp}?: {
    block?: number;
    timestamp?: number;
}): Promise<(Pool & {
    apy: number
    slpBalanceChange: number,
    slpBalanceChangeCount: number,
    userCountChange: number,
    userCountChangeCount: number,
    sushiHarvestedChange: number,
    sushiHarvestedChangeCount: number
})[]>;