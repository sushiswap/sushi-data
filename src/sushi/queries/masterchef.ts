import pageResults from 'graph-results-pager';

import { request, gql } from 'graphql-request';

import { graphAPIEndpoints, chefAddress, TWENTY_FOUR_HOURS } from '../../constants';
import { 
    timestampToBlock,
    getAverageBlockTime,
    blockToTimestamp
} from '../../utils';

import { pairs as exchangePairs } from './exchange';
import { priceUSD as sushiPriceUSD } from'./sushi';

import type {
    Arg1,
    Awaited,
} from './../../../types'

import type {
    MasterChef,
    Pool, User,
} from './../../../types/subgraphs/masterchef'



export async function info({block = undefined, timestamp = undefined}: Arg1 = {}) {
    block = block ? block : timestamp ? (await timestampToBlock(timestamp)) : undefined;
    const blockString = block ? `block: { number: ${block} }` : "";

    const result = await request(graphAPIEndpoints.masterchef,
        gql`{
                masterChef(id: "${chefAddress}", ${blockString}) {
                    ${info_properties.toString()}
                }
            }`
    );

    return info_callback(result.masterChef);
}



export async function pool({block = undefined, timestamp = undefined, poolId = undefined, address = undefined}: (
    Arg1 & {
        poolId?: number,
        address?: string
    }
)) {
    if(!poolId && !address) { throw new Error("sushi-data: Pool ID / Address undefined"); }

    block = block ? block : timestamp ? (await timestampToBlock(timestamp)) : undefined;
    const blockString = block ? `block: { number: ${block} }` : "";

    let result;
    if(poolId) {
        result = await request(graphAPIEndpoints.masterchef,
            gql`{
                    pool(id: ${poolId}, ${blockString}) {
                        ${pool_properties.toString()}
                    }
                }`
        );
    }

    else {
        result = await request(graphAPIEndpoints.masterchef,
            gql`{
                    pools(first: 1, where: {pair: "${address!.toLowerCase()}"}, ${blockString}) {
                        ${pool_properties.toString()}
                    }
                }`
        );
    }

    return pool_callback(poolId ? [result.pool] : result.pools)[0];
}



export async function pools({block = undefined, timestamp = undefined}: Arg1 = {}) {
    const results = await pageResults({
        api: graphAPIEndpoints.masterchef,
        query: {
            entity: 'pools',
            selection: {
                block: block ? { number: block } : timestamp ? { number: await timestampToBlock(timestamp) } : undefined,
            },
            properties: pool_properties
        }
    })

    return pool_callback(results);
}



export async function stakedValue({block = undefined, timestamp = undefined, address}: (
    Arg1 & {address: string}
)) {
    if(!address) { throw new Error("sushi-data: Token address undefined"); }

    block = block ? block : timestamp ? (await timestampToBlock(timestamp)) : undefined;
    const blockString = block ? `block: { number: ${block} }` : "";

    const result = await request(graphAPIEndpoints.exchange,
        gql`{
                liquidityPosition(id: "${address.toLowerCase()}-${chefAddress}", ${blockString}) {
                    ${stakedValue_properties.toString()}
                }
            }`
    );

    return stakedValue_callback(result.liquidityPosition);
}



export async function user({block = undefined, timestamp = undefined, address}: (
    Arg1 & {address: string}
)) {
    if(!address) { throw new Error("sushi-data: User address undefined"); }

    const results = await pageResults({
        api: graphAPIEndpoints.masterchef,
        query: {
            entity: 'users',
            selection: {
                where: {
                    address: `\\"${address.toLowerCase()}\\"`
                },
                block: block ? { number: block } : timestamp ? { number: await timestampToBlock(timestamp) } : undefined,
            },
            properties: user_properties
        }
    })

    return user_callback(results);
}



export async function users({block = undefined, timestamp = undefined}: Arg1 = {}) {
    const results = await pageResults({
        api: graphAPIEndpoints.masterchef,
        query: {
            entity: 'users',
            selection: {
                block: block ? { number: block } : timestamp ? { number: await timestampToBlock(timestamp) } : undefined,
            },
            properties: user_properties
        }
    })

    return user_callback(results);
}



export async function apys({block = undefined, timestamp = undefined}: Arg1 = {}) {
    const [
        masterchefList,
        exchangeList,
        sushiUSD
     ] = await Promise.all([
        pools({block, timestamp}),
        exchangePairs({block, timestamp}),
        sushiPriceUSD({block, timestamp})
     ]);

    const totalAllocPoint = masterchefList.reduce((a, b) => a + b.allocPoint, 0);

    const averageBlockTime = await getAverageBlockTime({block, timestamp});

    return masterchefList.map(masterchefPool => {
        const exchangePool = exchangeList.find((e: any) => e.id === masterchefPool.pair);
        if(!exchangePool) {
            return {...masterchefPool, apy: 0};
        }

        const tvl = masterchefPool.slpBalance * (exchangePool.reserveUSD / exchangePool.totalSupply);
        const sushiPerBlock = (masterchefPool.allocPoint / (totalAllocPoint) * 100);
        const apy = sushiUSD * (sushiPerBlock * (60 / averageBlockTime) * 60 * 24 * 365) / tvl * 100 * 3; // *3 => vesting

        return {...masterchefPool, apy};
    });
}



export async function apys24h({block = undefined, timestamp = undefined}: Arg1 = {}) {
    const timestampNow = timestamp ? timestamp : block ? await blockToTimestamp(block) : (Math.floor(Date.now() / 1000));
    const timestamp24ago = timestampNow - TWENTY_FOUR_HOURS;

    block = timestamp ? await timestampToBlock(timestamp) : block;
    const block24ago = await timestampToBlock(timestamp24ago);

    const [results, results24ago] = await Promise.all([
        apys({block: block}), 
        apys({block: block24ago})
    ]);

    return apys_callback24h(results, results24ago);
}

export default {
    info,
    pool,
    pools,
    stakedValue,
    user,
    users,
    apys,
    apys24h
}



const info_properties = [
    'bonusMultiplier',
    'bonusEndBlock',
    'devaddr',
    'migrator',
    'owner',
    'startBlock',
    'sushi',
    'sushiPerBlock',
    'totalAllocPoint',
    'poolCount',
    'slpBalance',
    'slpAge',
    'slpAgeRemoved',
    'slpDeposited',
    'slpWithdrawn',
    'updatedAt'
];

function info_callback(result: MasterChef) {
    return ({
        bonusMultiplier: Number(result.bonusMultiplier),
        bonusEndBlock: Number(result.bonusEndBlock),
        devaddr: result.devaddr,
        migrator: result.migrator,
        owner: result.owner,
        startBlock: Number(result.startBlock),
        sushiPerBlock: Number(BigInt(result.sushiPerBlock) / BigInt(1e18)),
        totalAllocPoint: Number(result.totalAllocPoint),
        poolCount: Number(result.poolCount),
        slpBalance: Number(result.slpBalance),
        slpAge: Number(result.slpAge),
        slpAgeRemoved: Number(result.slpAgeRemoved),
        slpDeposited: Number(result.slpDeposited),
        slpWithdrawn: Number(result.slpWithdrawn),
        updatedAt: Number(result.updatedAt)
    });
};



const pool_properties = [
    'id',
    'pair',
    'allocPoint',
    'lastRewardBlock',
    'accSushiPerShare',
    'balance',
    'userCount',
    'slpBalance',
    'slpAge',
    'slpAgeRemoved',
    'slpDeposited',
    'slpWithdrawn',
    'timestamp',
    'block',
    'updatedAt',
    'entryUSD',
    'exitUSD',
    'sushiHarvested',
    'sushiHarvestedUSD'
];

function pool_callback(results: Pool[]) {   
    return results.map(({ id, pair, allocPoint, lastRewardBlock, accSushiPerShare, userCount, slpBalance, slpAge, slpAgeRemoved, slpDeposited, slpWithdrawn, timestamp, block, updatedAt, entryUSD, exitUSD, sushiHarvested, sushiHarvestedUSD }) => ({
        id: Number(id),
        pair: String(pair),
        allocPoint: Number(allocPoint),
        lastRewardBlock: Number(lastRewardBlock),
        accSushiPerShare: BigInt(accSushiPerShare),
        userCount: Number(userCount),
        slpBalance: Number(slpBalance),
        slpAge: Number(slpAge),
        slpAgeRemoved: Number(slpAgeRemoved),
        slpDeposited: Number(slpDeposited),
        slpWithdrawn: Number(slpWithdrawn),
        addedTs: Number(timestamp),
        addedDate: new Date(Number(timestamp) * 1000),
        addedBlock: Number(block),
        lastUpdatedTs: Number(updatedAt),
        lastUpdatedDate: new Date(Number(updatedAt) * 1000),
        entryUSD: Number(entryUSD),
        exitUSD: Number(exitUSD),
        sushiHarvested: Number(sushiHarvested),
        sushiHarvestedUSD: Number(sushiHarvestedUSD)
        }));
}



const stakedValue_properties = [
    'id',
    'liquidityTokenBalance',
    'pair { id, totalSupply, reserveETH, reserveUSD }'
];

function stakedValue_callback(result: any) {
    return ({
        id: String(result.id),
        liquidityTokenBalance: Number(result.liquidityTokenBalance),
        totalSupply: Number(result.pair.totalSupply),
        totalValueETH: Number(result.pair.reserveETH),
        totalValueUSD: Number(result.pair.reserveUSD)
    })
}



const user_properties = [
    'id',
    'address',
    'pool { id, pair, balance, accSushiPerShare, lastRewardBlock }',
    'amount',
    'rewardDebt',
    'entryUSD',
    'exitUSD',
    'sushiHarvested',
    'sushiHarvestedUSD',
];

function user_callback(results: User[]) {
    return results.map(result => ({
        id: String(result.id),
        address: String(result.address),
        poolId: Number(result.id?.split("-")[0]),
        pool: result.pool ? {
            id: String(result.pool.id),
            pair: String(result.pool.pair),
            balance: Number(result.pool.balance),
            accSushiPerShare: BigInt(result.pool.accSushiPerShare),
            lastRewardBlock: Number(result.pool.lastRewardBlock)
        } : undefined,
        amount: Number(result.amount),
        rewardDebt: BigInt(result.rewardDebt),
        exitUSD: Number(result.exitUSD),
        sushiHarvested: Number(result.sushiHarvested),
        sushiHarvestedUSD: Number(result.sushiHarvestedUSD),
    }));
};

function apys_callback24h(results: Awaited<ReturnType<typeof apys>>, results24h: Awaited<ReturnType<typeof apys>>) {
    return results.map(result => {
        const result24h = results24h.find(e => e.id === result.id) || result;

        return ({
            ...result,

            slpBalanceChange: (result.slpBalance / result24h.slpBalance) * 100 - 100,
            slpBalanceChangeCount: result.slpBalance - result24h.slpBalance,

            userCountChange: (result.userCount / result24h.userCount) * 100 - 100,
            userCountChangeCount: result.userCount - result24h.userCount,

            sushiHarvestedChange: (result.sushiHarvested / result24h.sushiHarvested) * 100 - 100,
            sushiHarvestedChangeCount: result.sushiHarvested - result24h.sushiHarvested,
        });
    });
};