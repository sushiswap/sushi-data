import pageResults from 'graph-results-pager';

import { graphAPIEndpoints } from '../../constants';
import { timestampToBlock } from '../../utils';

import { Arg1, Arg4 } from '../../../types';
import { LiquidityPosition, LiquidityPositionSnapshot } from '../../../types/subgraphs/exchange_v1';

export async function userHistory({minTimestamp = undefined, maxTimestamp = undefined, minBlock = undefined, maxBlock = undefined, max = undefined,  address}: (
    Arg4 & {address: string}
)) {
    if(!address) { throw new Error("sushi-data: User address undefined"); }

    const results = await pageResults({
        api: graphAPIEndpoints.exchange_v1,
        query: {
            entity: 'liquidityPositionSnapshots',
            selection: {
                where: {
                    user: `\\"${address.toLowerCase()}\\"`,
                    block_gte: minBlock || undefined,
                    block_lte: maxBlock || undefined,
                    timestamp_gte: minTimestamp || undefined,
                    timestamp_lte: maxTimestamp || undefined,
                },
            },
            properties: userHistory_properties
        },
        max
    })

    return userHistory_callback(results)
}



export async function userPositions({block = undefined, timestamp = undefined, address}: (
    Arg1 & {address: string}
)) {
    if(!address) { throw new Error("sushi-data: User address undefined"); }

    const results = await pageResults({
        api: graphAPIEndpoints.exchange_v1,
        query: {
            entity: 'liquidityPositions',
            selection: {
                where: {
                    user: `\\"${address.toLowerCase()}\\"`,
                },
                block: block ? { number: block } : timestamp ? { number: await timestampToBlock(timestamp) } : undefined,
            },
            properties: userPositions_properties
        }
    })

    return userPositions_callback(results)
}

export default {
    userHistory,
    userPositions
}



const userHistory_properties = [
    'id',
    'timestamp',
    'block',
    `pair {
        id, 
        reserve0, 
        reserve1, 
        reserveUSD, 
        token0 { id },
        token1 { id } 
    }`,
    'token0PriceUSD',
    'token1PriceUSD',
    'reserve0',
    'reserve1',
    'reserveUSD',
    'liquidityTokenTotalSupply',
    'liquidityTokenBalance',        
];

function userHistory_callback(results: LiquidityPositionSnapshot[]) {
    return results.map(result => ({
        id: String(result.id),
        timestamp: Number(result.timestamp),
        block: Number(result.block),
        pair: {
            id: String(result.pair?.id),
            reserve0: Number(result.pair?.reserve0),
            reserve1: Number(result.pair?.reserve1),
            reserveUSD: Number(result.pair?.reserveUSD),
            token0: {
                id: String(result.pair?.token0?.id)
            },
            token1: {
                id: String(result.pair?.token1?.id)
            },
        },
        token0PriceUSD: Number(result.token0PriceUSD),
        token1PriceUSD: Number(result.token1PriceUSD),
        reserve0: Number(result.reserve0),
        reserve1: Number(result.reserve1),
        reserveUSD: Number(result.reserveUSD),
        liquidityTokenTotalSupply: Number(result.liquidityTokenTotalSupply),
        liquidityTokenBalance: Number(result.liquidityTokenBalance),
    }));
}



const userPositions_properties = [
    'id',
    `pair {
        id, 
        reserve0, 
        reserve1, 
        reserveUSD, 
        token0 { 
            id, 
            symbol, 
            derivedETH
        }, 
        token1 { 
            id, 
            symbol, 
            derivedETH 
        }, 
        totalSupply }`,
    'liquidityTokenBalance',
];

function userPositions_callback(results: LiquidityPosition[]) {
    return results.map(result => ({
        id: String(result.id),
        pair: {
            id: String(result.pair?.id),
            reserve0: Number(result.pair?.reserve0),
            reserve1: Number(result.pair?.reserve1),
            reserveUSD: Number(result.pair?.reserveUSD),
            token0: {
                id: String(result.pair?.token0?.id),
                symbol: String(result.pair?.token0?.symbol),
                derivedETH: Number(result.pair?.token0?.derivedETH)
            },
            token1: {
                id: String(result.pair?.token1?.id),
                symbol: String(result.pair?.token1?.symbol),
                derivedETH: Number(result.pair?.token1?.derivedETH)
            },
            totalSupply: Number(result.pair?.totalSupply)
        },
        liquidityTokenBalance: Number(result.liquidityTokenBalance)
    }));
}
