import pageResults from 'graph-results-pager';

import ws from 'isomorphic-ws';
import { SubscriptionClient } from 'subscriptions-transport-ws'; 

import { request, gql } from 'graphql-request';

import {
    subWeeks,
    getUnixTime,
    fromUnixTime
} from "date-fns";

import { graphAPIEndpoints, graphWSEndpoints, TWENTY_FOUR_HOURS } from '../../../constants';
import { timestampToBlock, timestampsToBlocks, blockToTimestamp } from '../../../utils';

import { ethPrice } from'./eth';

import type {
    Arg1,
    Arg2,
    Arg4,
    Awaited,
} from './../../../../types'

import { Pair, PairDayData } from '../../../../types/subgraphs/exchange';



export async function pair({block = undefined, timestamp = undefined, address}: (
    Arg1 & {address: string}
)) {
    if(!address) { throw new Error("sushi-data: Pair address undefined"); }

    block = block ? block : timestamp ? (await timestampToBlock(timestamp)) : undefined;
    const blockString = block ? `block: { number: ${block} }` : "";

    const result = await request(graphAPIEndpoints.exchange,
        gql`{
                pair(id: "${address.toLowerCase()}", ${blockString}) {
                    ${pair_properties.toString()}
                }
            }`
    );

    return pair_callback([result.pair])[0];
}



export async function pair24h({block = undefined, timestamp = undefined, address}: (
    Arg1 & {address: string}
)) {
    if(!address) { throw new Error("sushi-data: Pair address undefined"); }
    
    let timestampNow = timestamp ? timestamp : block ? await blockToTimestamp(block) : (Math.floor(Date.now() / 1000));
    const timestamp24ago = timestampNow - TWENTY_FOUR_HOURS;
    const timestamp48ago = timestamp24ago - TWENTY_FOUR_HOURS;

    block = timestamp ? await timestampToBlock(timestamp) : block;
    const [block24ago, block48ago] = await Promise.all([
        timestampToBlock(timestamp24ago),
        timestampToBlock(timestamp48ago)
    ]);

    const [result, result24ago, result48ago] = await Promise.all([
        pair({block: block, address}),
        pair({block: block24ago, address}),
        pair({block: block48ago, address})
    ])

    const [ethPriceUSD, ethPriceUSD24ago] = await Promise.all([
        ethPrice({block: block}),
        ethPrice({block: block24ago})
    ]);

    return pair_callback24h([result], [result24ago], [result48ago], ethPriceUSD, ethPriceUSD24ago)[0];
}



export async function pairHourData({minTimestamp = undefined, maxTimestamp = undefined, minBlock = undefined, maxBlock = undefined, address}: (
    Arg4 & {address: string}
)) {
    if(!address) { throw new Error("sushi-data: Pair address undefined"); }
    
    minTimestamp = minBlock ? await blockToTimestamp(minBlock!) : minTimestamp;
    maxTimestamp = maxBlock ? await blockToTimestamp(maxBlock!) : maxTimestamp;

    const endTime = maxTimestamp ? fromUnixTime(maxTimestamp) : new Date();
    let time = minTimestamp ? minTimestamp : getUnixTime(subWeeks(endTime, 1));

    // create an array of hour start times until we reach current hour
    const timestamps: number[] = [];
    while (time <= getUnixTime(endTime) - 3600) {
        timestamps.push(time);
        time += 3600;
    }

    let blocks = await timestampsToBlocks(timestamps);

    const query = (
        gql`{
            ${blocks.map((block, i) => (gql`
                timestamp${timestamps[i]}: pair(id: "${address.toLowerCase()}", block: {number: ${block}}) {
                    ${pair_properties.toString()}
            }`))}
        }`
    );

    let result = await request(graphAPIEndpoints.exchange, query)
    result = Object.keys(result)
        .map(key => ({...result[key], timestamp: Number(key.split("timestamp")[1])}))
        .sort((a, b) => (a.timestamp) - (b.timestamp));

    return pair_callbackHourData(result);
}



export async function pairDayData({minTimestamp = undefined, maxTimestamp = undefined, minBlock = undefined, maxBlock = undefined, address}: (
    Arg4 & {address: string}
)) {
    if(!address) { throw new Error("sushi-data: Pair address undefined"); }
    
    const results = await pageResults({
        api: graphAPIEndpoints.exchange,
        query: {
            entity: 'pairDayDatas',
            selection: {
                orderDirection: 'desc',
                where: {
                    pair: `\\"${address.toLowerCase()}\\"`,
                    date_gte: minTimestamp || (minBlock ? await blockToTimestamp(minBlock) : undefined),
                    date_lte: maxTimestamp || (maxBlock ? await blockToTimestamp(maxBlock) : undefined),
                },
            },
            properties: pair_propertiesDayData
        }
    })

    return pair_callbackDayData(results);
}



export function observePair({address}: {address: string}) {
    if(!address) { throw new Error("sushi-data: Pair address undefined"); }

    const query = gql`
        subscription {
            pair(id: "${address.toLowerCase()}") {
                ${pair_properties.toString()}
            }
        }`

    const client = new SubscriptionClient(graphWSEndpoints.exchange, { reconnect: true, }, ws,);
    const observable = client.request({ query });

    return {
        subscribe({next, error, complete}: {
            next(data: Awaited<ReturnType<typeof pair>>): any;
            error?(error: any): any;
            complete?: (() => void) | undefined;
        }) {
            return observable.subscribe({
                next(results) {
                    next(pair_callback(results?.data?.pair)[0]);
                },
                error,
                complete
            });
        }
    };
}



export async function pairs({block = undefined, timestamp = undefined, max = undefined, addresses = undefined}: (
    Arg2 & {addresses?: string[] | undefined}
) = {}) {
    if(addresses) {
        
        block = block ? block : timestamp ? (await timestampToBlock(timestamp)) : undefined;
        const blockString = block ? `block: { number: ${block} }` : "";

        const query = (
            gql`{
                ${addresses.map((pair, i) => (`
                    pair${i}: pair(id: "${pair.toLowerCase()}", ${blockString}) {
                        ${pair_properties.toString()}
                }`))}
            }`
        );

        const result: Pair[] = Object.values(await request(graphAPIEndpoints.exchange, query));
        return pair_callback(result);
    }
    
    const results = await pageResults({
        api: graphAPIEndpoints.exchange,
        query: {
            entity: 'pairs',
            selection: {
                block: block ? { number: block } : timestamp ? { number: await timestampToBlock(timestamp) } : undefined,
            },
            properties: pair_properties
        },
        max
    });

    return pair_callback(results);
}



export async function pairs24h({block = undefined, timestamp = undefined, max = undefined}: Arg2 = {}) {
    let timestampNow = timestamp ? timestamp : block ? await blockToTimestamp(block) : (Math.floor(Date.now() / 1000));
    const timestamp24ago = timestampNow - TWENTY_FOUR_HOURS;
    const timestamp48ago = timestamp24ago - TWENTY_FOUR_HOURS;

    block = timestamp ? await timestampToBlock(timestamp) : block;
    const block24ago = await timestampToBlock(timestamp24ago);
    const block48ago = await timestampToBlock(timestamp48ago);

    const [results, results24ago, results48ago] = await Promise.all([
        pairs({block: block, max}),
        pairs({block: block24ago, max}),
        pairs({block: block48ago, max})
    ]);

    const [ethPriceUSD, ethPriceUSD24ago] = await Promise.all([
        ethPrice({block: block}),
        ethPrice({block: block24ago})
    ]);

    return pair_callback24h(results, results24ago, results48ago, ethPriceUSD, ethPriceUSD24ago);
}



export function observePairs () {
    const query = gql`
        subscription {
            pairs(first: 1000, orderBy: reserveUSD, orderDirection: desc) {
                ${pair_properties.toString()}
            }
    }`;

    const client = new SubscriptionClient(graphWSEndpoints.exchange, { reconnect: true, }, ws,);
    const observable = client.request({ query });

    return {
        subscribe({next, error, complete}: {
            next(data: Awaited<ReturnType<typeof pairs>>): any;
            error?(error: any): any;
            complete?: (() => void) | undefined;
        }) {
            return observable.subscribe({
                next(results) {
                    next(pair_callback(results?.data?.pairs));
                },
                error,
                complete
            });
        }
    };
}

export default {
    pair,
    pair24h,
    pairHourData,
    pairDayData,
    observePair,
    pairs,
    pairs24h,
    observePairs
}




const pair_properties = [
    'id',
    `token0 { 
        id, 
        name, 
        symbol, 
        totalSupply, 
        derivedETH
    }`,
    `token1 {
        id,
        name,
        symbol,
        totalSupply,
        derivedETH
    }`,
    'reserve0',
    'reserve1',
    'totalSupply',
    'reserveETH',
    'reserveUSD',
    'trackedReserveETH',
    'token0Price',
    'token1Price',
    'volumeToken0',
    'volumeToken1',
    'volumeUSD',
    'untrackedVolumeUSD',
    'txCount',
];

function pair_callback(results: Pair[]) {
    return results
        .map((result) => ({
            id: String(result.id),
            token0: { 
                id: String(result?.token0?.id),
                name: String(result?.token0?.name),
                symbol: String(result?.token0?.symbol),
                totalSupply: Number(result?.token0?.totalSupply),
                derivedETH: Number(result?.token0?.derivedETH),
            },
            token1: { 
                id: String(result?.token1?.id),
                name: String(result?.token1?.name),
                symbol: String(result?.token1?.symbol),
                totalSupply: Number(result?.token1?.totalSupply),
                derivedETH: Number(result?.token1?.derivedETH),
            },
            reserve0: Number(result.reserve0),
            reserve1: Number(result.reserve1),
            totalSupply: Number(result.totalSupply),
            reserveETH: Number(result.reserveETH),
            reserveUSD: Number(result.reserveUSD),
            trackedReserveETH: Number(result.trackedReserveETH),
            token0Price: Number(result.token0Price),
            token1Price: Number(result.token1Price),
            volumeToken0: Number(result.volumeToken0),
            volumeToken1: Number(result.volumeToken1),
            volumeUSD: Number(result.volumeUSD),
            untrackedVolumeUSD: Number(result.untrackedVolumeUSD),
            txCount: Number(result.txCount),
        }))
    .sort((a, b) => b.reserveUSD - a.reserveUSD);     
};



function pair_callback24h(
        results: Awaited<ReturnType<typeof pairs>>,
        results24h: Awaited<ReturnType<typeof pairs>>, 
        results48h: Awaited<ReturnType<typeof pairs>>, 
        ethPriceUSD: number, 
        ethPriceUSD24ago: number
    ) {

    return results.map(result => {
        const result24h = results24h.find(e => e.id === result.id) || result;
        const result48h = results48h.find(e => e.id === result.id) || result;

        return ({
            ...result,
            
            trackedReserveUSD: result.trackedReserveETH * ethPriceUSD,
            trackedReserveUSDChange: (result.trackedReserveETH * ethPriceUSD) / (result24h.trackedReserveETH * ethPriceUSD24ago) * 100 - 100,
            trackedReserveUSDChangeCount: result.trackedReserveETH * ethPriceUSD - result24h.trackedReserveETH* ethPriceUSD24ago,

            trackedReserveETHChange: (result.trackedReserveETH / result24h.trackedReserveETH) * 100 - 100,
            trackedReserveETHChangeCount: result.trackedReserveETH - result24h.trackedReserveETH,

            volumeUSDOneDay: result.volumeUSD - result24h.volumeUSD,
            volumeUSDChange: (result.volumeUSD - result24h.volumeUSD) / (result24h.volumeUSD - result48h.volumeUSD) * 100 - 100,
            volumeUSDChangeCount: (result.volumeUSD - result24h.volumeUSD) - (result24h.volumeUSD - result48h.volumeUSD),
            
            untrackedVolumeUSDOneDay: result.untrackedVolumeUSD - result24h.untrackedVolumeUSD,
            untrackedVolumeUSDChange: (result.untrackedVolumeUSD - result24h.untrackedVolumeUSD) / (result24h.untrackedVolumeUSD - result48h.untrackedVolumeUSD) * 100 - 100,
            untrackedVolumeUSDChangeCount: (result.untrackedVolumeUSD - result24h.untrackedVolumeUSD) - (result24h.untrackedVolumeUSD - result48h.untrackedVolumeUSD),

            txCountOneDay: result.txCount - result24h.txCount,
            txCountChange: (result.txCount - result24h.txCount) / (result24h.txCount - result48h.txCount) * 100 - 100,
            txCountChangeCount: (result.txCount - result24h.txCount) - (result24h.txCount - result48h.txCount),
        });
    });
}



function pair_callbackHourData(results: (Pair & {timestamp: number})[]) {
    return results.map((result: any) => ({
        id: String(result.id),
        token0: { 
            id: String(result.token0.id),
            name: String(result.token0.name),
            symbol: String(result.token0.symbol),
            totalSupply: Number(result.token0.totalSupply),
            derivedETH: Number(result.token0.derivedETH),
        },
        token1: { 
            id: String(result.token1.id),
            name: String(result.token1.name),
            symbol: String(result.token1.symbol),
            totalSupply: Number(result.token1.totalSupply),
            derivedETH: Number(result.token1.derivedETH),
        },
        reserve0: Number(result.reserve0),
        reserve1: Number(result.reserve1),
        totalSupply: Number(result.totalSupply),
        reserveETH: Number(result.reserveETH),
        reserveUSD: Number(result.reserveUSD),
        trackedReserveETH: Number(result.trackedReserveETH),
        token0Price: Number(result.token0Price),
        token1Price: Number(result.token1Price),
        volumeToken0: Number(result.volumeToken0),
        volumeToken1: Number(result.volumeToken1),
        volumeUSD: Number(result.volumeUSD),
        untrackedVolumeUSD: Number(result.untrackedVolumeUSD),
        txCount: Number(result.txCount),
        timestamp: String(result.timestamp)
    }));
}



const pair_propertiesDayData = [
    'id',
    'date',
    'volumeUSD',
    'volumeToken0',
    'volumeToken1',
    'reserveUSD',
    'txCount'
];

function pair_callbackDayData(results: PairDayData[]) {
    return results.map(result => ({
        id: String(result.id),
        date: new Date(Number(result.date) * 1000),
        timestamp: Number(result.date),
        volumeUSD: Number(result.volumeUSD),
        volumeToken0: Number(result.volumeToken0),
        volumeToken1: Number(result.volumeToken1),
        liquidityUSD: Number(result.reserveUSD),
        txCount: Number(result.txCount)
    }));
}